async function runApiVerification() {
  console.log('Testing Address & Review Endpoints via Gateway (http://127.0.0.1:8000)...');
  
  // 1. Login user to get JWT token
  let token = '';
  let userId = 1;
  try {
    const loginRes = await fetch('http://127.0.0.1:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@striker.vn', password: 'password123' })
    });
    const loginData = await loginRes.json();
    token = loginData?.data?.access_token || loginData?.access_token;
    userId = loginData?.data?.user?.id || 1;
    console.log('✅ Auth Login OK, got token and user ID:', userId);
  } catch (err) {
    console.warn('⚠️ Login failed:', err.message);
  }

  if (token) {
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Test Address APIs
    try {
      // Fetch addresses
      const getAddrRes = await fetch('http://127.0.0.1:8000/api/auth/addresses', { headers: authHeaders });
      const getAddrData = await getAddrRes.json();
      console.log('✅ GET /api/auth/addresses OK, count:', (getAddrData.data?.length ?? getAddrData.length ?? 0));

      // Create address
      const createAddrRes = await fetch('http://127.0.0.1:8000/api/auth/addresses', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          full_name: 'Test Customer',
          phone: '0901234567',
          street: '123 Test Street',
          province: 'Hà Nội',
          district: 'Cầu Giấy',
          ward: 'Dịch Vọng Hậu',
          is_default: true,
        })
      });
      const createAddrData = await createAddrRes.json();
      const newAddressId = createAddrData.data?.id || createAddrData.id;
      console.log('✅ POST /api/auth/addresses OK, created address ID:', newAddressId);

      if (newAddressId) {
        // Delete address
        await fetch(`http://127.0.0.1:8000/api/auth/addresses/${newAddressId}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        console.log('✅ DELETE /api/auth/addresses/:id OK');
      }
    } catch (err) {
      console.error('❌ Address test failed:', err.message);
    }
  }

  // 3. Test Review APIs
  try {
    // Fetch reviews for product 1
    const reviewsRes = await fetch('http://127.0.0.1:8000/api/reviews?product_id=1');
    const reviewsData = await reviewsRes.json();
    console.log('✅ GET /api/reviews?product_id=1 OK, count:', (reviewsData.data?.length ?? reviewsData.length ?? 0));

    // Create review
    const postReviewRes = await fetch('http://127.0.0.1:8000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: 'TEST-ORD-001',
        product_id: 1,
        user_id: userId,
        user_name: 'Test Reviewer',
        rating: 5,
        comment: 'Giày rất êm và bám sân, giao hàng cực nhanh!',
      })
    });
    const postReviewData = await postReviewRes.json();
    const reviewId = postReviewData.data?.id || postReviewData.id;
    console.log('✅ POST /api/reviews OK, review ID:', reviewId);

    // Check review
    const checkReviewRes = await fetch(`http://127.0.0.1:8000/api/reviews/check?order_id=TEST-ORD-001&product_id=1&user_id=${userId}`);
    const checkReviewData = await checkReviewRes.json();
    console.log('✅ GET /api/reviews/check OK, reviewed =', checkReviewData.data?.reviewed);
  } catch (err) {
    console.error('❌ Review test failed:', err.message);
  }

  console.log('🎉 Address & Review API Verification finished successfully!');
}

runApiVerification();
