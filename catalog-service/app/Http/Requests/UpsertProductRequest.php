<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class UpsertProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Product|null $product */
        $product = $this->route('product');
        $productId = $product?->id;
        $required = $product === null ? 'required' : 'sometimes';

        return [
            'category_id' => [$required, 'integer', 'exists:categories,id'],
            'name' => [$required, 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug,'.$productId],
            'sku' => [$required, 'string', 'max:100', 'regex:/^[A-Z0-9_-]+$/i', 'unique:products,sku,'.$productId],
            'description' => ['nullable', 'string'],
            'price' => [$required, 'numeric', 'min:1000'],
            'old_price' => ['nullable', 'numeric', 'min:0'],
            'stock' => [$required, 'integer', 'min:0', 'max:1000000'],
            'brand' => [$required, 'string', 'max:255'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string', 'max:2048'],
            'colors' => ['nullable', 'array'],
            'sizes' => ['nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
