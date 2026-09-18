<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use App\Mail\OtpMail;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    /**
     * Register with an email address or phone number.
     *
     * @group Authentication
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $email = !empty($validated['email']) ? strtolower(trim($validated['email'])) : null;
        $phoneNumber = !empty($validated['phone']) ? trim($validated['phone']) : (!empty($validated['phone_number']) ? trim($validated['phone_number']) : null);

        if (!$email && !$phoneNumber && !empty($validated['identifier'])) {
            [$email, $phoneNumber] = $this->parseIdentifier($validated['identifier']);
        }

        if (!$email && !$phoneNumber) {
            abort(422, 'Vui lòng cung cấp địa chỉ Email hoặc Số điện thoại để đăng ký.');
        }

        $exists = User::query()
            ->where(function ($query) use ($email, $phoneNumber) {
                if ($email) {
                    $query->where('email', $email);
                }
                if ($phoneNumber) {
                    $query->orWhere('phone_number', $phoneNumber);
                }
            })
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Email hoặc số điện thoại này đã được đăng ký tài khoản.',
                'data' => null,
                'errors' => ['identifier' => ['Tài khoản đã tồn tại.']],
            ], 422);
        }

        $user = User::create([
            'name' => trim($validated['name']),
            'email' => $email,
            'phone_number' => $phoneNumber,
            'password' => Hash::make($validated['password']),
            'role' => 'user',
            'is_active' => true,
        ]);

        if ($email) {
            $this->createOtp($email);

            return response()->json([
                'success' => true,
                'message' => 'Đăng ký tài khoản thành công. Vui lòng xác thực mã OTP gửi về email của bạn.',
                'requires_email_verification' => true,
                'email' => $email,
                'data' => [
                    'user' => $user,
                    'requires_email_verification' => true,
                    'email' => $email,
                ],
                'errors' => null,
            ], 201);
        }

        return $this->tokenResponse($user, 'Đăng ký tài khoản thành công.', 201, false);
    }

    /**
     * Verify an email address with a six-digit OTP.
     *
     * @group Authentication
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'otp_code' => ['required', 'digits:6'],
        ]);

        $email = $validated['email'];
        $otpCode = $validated['otp_code'];

        // Lấy mã OTP từ Cache
        $cachedOtp = Cache::get('otp_' . $email);

        // Kiểm tra mã OTP
        if (!$cachedOtp || !hash_equals((string) $cachedOtp, (string) $otpCode)) {
            return response()->json([
                'success' => false,
                'message' => 'Mã OTP không chính xác hoặc đã hết hạn sử dụng.',
                'data' => null,
                'errors' => ['otp_code' => ['Mã OTP không hợp lệ.']],
            ], 422);
        }

        $user = User::where('email', $email)->first();
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy người dùng.',
                'data' => null,
                'errors' => ['email' => ['Tài khoản không tồn tại.']],
            ], 404);
        }

        // Cập nhật trạng thái xác thực
        $user->update(['email_verified_at' => now()]);
        
        // Xóa mã OTP khỏi Cache ngay khi xác thực thành công
        Cache::forget('otp_' . $email);

        return $this->tokenResponse($user->fresh(), 'Xác minh email thành công.', 200, false);
    }

    /**
     * Resend a new email verification OTP.
     *
     * @group Authentication
     */
    public function resendOtp(Request $request): JsonResponse
    {
        $validated = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', $validated['email'])->first();

        if (! $user || $user->email_verified_at) {
            return response()->json([
                'success' => false,
                'message' => 'Email này đã được xác minh hoặc không yêu cầu xác thực OTP.',
                'data' => null,
                'errors' => ['email' => ['Email đã được xác thực.']],
            ], 422);
        }

        $this->createOtp($user->email);

        return response()->json([
            'success' => true,
            'message' => 'Mã OTP mới đã được gửi về email của bạn.',
            'email' => $user->email,
            'requires_email_verification' => true,
            'data' => ['email' => $user->email],
            'errors' => null,
        ]);
    }

    /**
     * Authenticate with an email address or phone number.
     *
     * @group Authentication
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        [$email, $phoneNumber] = $this->parseIdentifier($validated['login']);
        $user = $email
            ? User::where('email', $email)->first()
            : User::where('phone_number', $phoneNumber)->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Thông tin đăng nhập hoặc mật khẩu không chính xác.',
                'data' => null,
                'errors' => ['login' => ['Thông tin đăng nhập không hợp lệ.']],
            ], 401);
        }

        if ($email && ! $user->email_verified_at) {
            return response()->json([
                'success' => false,
                'message' => 'Email chưa được xác minh',
                'email' => $user->email,
                'requires_email_verification' => true,
                'data' => ['email' => $user->email],
                'errors' => ['email' => ['Chưa xác thực email.']],
            ], 403);
        }

        return $this->tokenResponse($user, 'Đăng nhập thành công.', 200);
    }

    /**
     * Request a password reset email.
     *
     * @group Authentication
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        return response()->json([
            'success' => true,
            'message' => 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hòm thư của bạn.',
            'data' => null,
            'errors' => null,
        ]);
    }

    /**
     * Get the currently authenticated user.
     *
     * @group Authentication
     */
    public function me(): JsonResponse
    {
        $user = auth('api')->user();

        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin tài khoản thành công.',
            'user' => $user,
            'data' => $user,
            'errors' => null,
        ]);
    }

    /**
     * Invalidate the current access token.
     *
     * @group Authentication
     */
    public function logout(): JsonResponse
    {
        /** @var \Tymon\JWTAuth\JWTGuard $guard */
        $guard = auth('api');
        $guard->logout();

        return response()->json([
            'success' => true,
            'message' => 'Đã đăng xuất thành công.',
            'data' => null,
            'errors' => null,
        ]);
    }

    private function parseIdentifier(string $identifier): array
    {
        $identifier = trim($identifier);
        if (str_contains($identifier, '@')) {
            validator(['identifier' => $identifier], ['identifier' => ['email']])->validate();
            return [strtolower($identifier), null];
        }

        if (preg_match('/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/', $identifier)) {
            return [null, $identifier];
        }

        abort(422, 'Định dạng tài khoản phải là email hoặc số điện thoại hợp lệ.');
    }

    private function createOtp(string $email): void
    {
        $otp = (string) random_int(100000, 999999);
        
        // Lưu mã OTP vào Cache, gán key là 'otp_email', thời hạn 10 phút
        Cache::put('otp_' . $email, $otp, Carbon::now()->addMinutes(10));
        Mail::to($email)->send(new OtpMail($otp));
    }

    private function tokenResponse(User $user, string $message, int $status, bool $includeVerification = true): JsonResponse
    {
        /** @var \Tymon\JWTAuth\JWTGuard $guard */
        $guard = auth('api');
        $token = $guard->login($user);

        // Eager-load addresses so the frontend has them immediately without an extra API call
        $user->load('addresses');

        return response()->json([
            'success' => true,
            'message' => $message,
            'requires_email_verification' => $includeVerification && $user->email && ! $user->email_verified_at,
            'user' => $user,
            'token' => $token,
            'token_type' => 'bearer',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'bearer',
            ],
            'errors' => null,
        ], $status);
    }

    /**
     * Admin: List users / customers with addresses and search.
     *
     * @group Admin User Management
     */
    public function adminUsers(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $role = $request->query('role');
        $status = $request->query('status'); // 'active' or 'blocked'

        $query = User::with('addresses');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        if ($role) {
            $query->where('role', $role);
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'blocked') {
            $query->where('is_active', false);
        }

        $users = $query->latest()->get()->map(function (User $user) {
            $defaultAddress = $user->addresses->firstWhere('is_default', true) ?? $user->addresses->first();
            $fullAddress = '';
            if ($defaultAddress) {
                $parts = array_filter([
                    $defaultAddress->street_address,
                    $defaultAddress->ward,
                    $defaultAddress->district,
                    $defaultAddress->province,
                ]);
                $fullAddress = implode(', ', $parts);
            }

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone_number ?? '',
                'phone_number' => $user->phone_number,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'is_active' => (bool) $user->is_active,
                'status' => $user->is_active ? 'active' : 'blocked',
                'address' => $fullAddress,
                'joinDate' => $user->created_at ? $user->created_at->format('d/m/Y') : '',
                'created_at' => $user->created_at ? $user->created_at->toISOString() : null,
                'addresses' => $user->addresses,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách người dùng thành công.',
            'data' => $users,
            'errors' => null,
        ]);
    }

    /**
     * Admin: Toggle user active/blocked status.
     *
     * @group Admin User Management
     */
    public function adminToggleStatus(Request $request, int|string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy người dùng.',
                'data' => null,
                'errors' => ['user' => ['Tài khoản không tồn tại.']],
            ], 404);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'Đã mở khóa tài khoản.' : 'Đã tạm khóa tài khoản.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'is_active' => (bool) $user->is_active,
                'status' => $user->is_active ? 'active' : 'blocked',
            ],
            'errors' => null,
        ]);
    }
}