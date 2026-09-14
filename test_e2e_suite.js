const API_URL = 'http://localhost:8000/api';

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE MICROSERVICES TEST SUITE 🚀');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} -> ${detail}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // 1. API GATEWAY ENVELOPE VERIFICATION
  // ----------------------------------------------------
  console.log('--- [1. API GATEWAY ENVELOPE & ERROR HANDLING] ---');
  
  // Test 1.1: Success Envelope
  const catList = await request('/categories');
  assert(
    catList.status === 200 && catList.data.success === true && Array.isArray(catList.data.data) && typeof catList.data.message === 'string',
    'Gateway Success Envelope has { success: true, data, message }',
    JSON.stringify(catList.data)
  );

  // Test 1.2: 404 Not Found Envelope
  const notFound = await request('/non-existent-endpoint');
  assert(
    notFound.status === 404 && notFound.data.success === false && notFound.data.error.code === 'NOT_FOUND',
    'Gateway 404 Envelope has { success: false, error: { code: "NOT_FOUND", message } }',
    JSON.stringify(notFound.data)
  );

  // Test 1.3: 422 Validation Error Envelope
  const invalidProd = await request('/products', { method: 'POST', body: JSON.stringify({}) });
  assert(
    invalidProd.status === 422 && invalidProd.data.success === false && invalidProd.data.error.code === 'VALIDATION_ERROR',
    'Gateway 422 Envelope has { success: false, error: { code: "VALIDATION_ERROR", message, details } }',
    JSON.stringify(invalidProd.data)
  );

  // ----------------------------------------------------
  // 2. CATALOG SERVICE (CATEGORY & BRAND DELETION SAFETY, STOCK CHECK & DEDUCTION)
  // ----------------------------------------------------
  console.log('\n--- [2. CATALOG SERVICE FEATURES & SAFETY] ---');

  const testId = Date.now();

  // Create Category for testing
  const createCat = await request('/categories', {
    method: 'POST',
    body: JSON.stringify({ name: `Áo Khoác Test ${testId}`, description: 'Test category' })
  });
  const catId = createCat.data?.data?.id;
  assert(createCat.status === 201 && catId, `Created Category #${catId} successfully`);

  // Create Brand for testing
  const createBrand = await request('/brands', {
    method: 'POST',
    body: JSON.stringify({ name: `Brand Test ${testId}` })
  });
  const brandId = createBrand.data?.data?.id;
  assert(createBrand.status === 201 && brandId, `Created Brand #${brandId} successfully`);

  // Create Product in that Category & Brand
  const createProd = await request('/products', {
    method: 'POST',
    body: JSON.stringify({
      name: `Áo Khoác Bomber Test ${testId}`,
      sku: `BOMBER-${testId}`,
      category_id: catId,
      brand: `Brand Test ${testId}`,
      price: 1500000,
      stock: 20,
      is_active: true
    })
  });
  const prodId = createProd.data?.data?.id;
  assert(createProd.status === 201 && prodId && createProd.data.data.stock === 20, `Created Product #${prodId} with stock = 20`);

  // Stock Check API
  const stockCheckOk = await request('/products/check-stock', {
    method: 'POST',
    body: JSON.stringify({ items: [{ product_id: prodId, quantity: 5 }] })
  });
  assert(stockCheckOk.status === 200 && stockCheckOk.data.data.is_available === true, 'Stock Check: 5 units available');

  const stockCheckFail = await request('/products/check-stock', {
    method: 'POST',
    body: JSON.stringify({ items: [{ product_id: prodId, quantity: 50 }] })
  });
  assert(
    stockCheckFail.status === 422 && stockCheckFail.data.success === false && stockCheckFail.data.error?.details?.stock?.length > 0,
    'Stock Check: 50 units exceeds stock and returns 422 with stock error details'
  );

  // Delete Category -> Reassigns product to "Khác"
  const delCat = await request(`/categories/${catId}`, { method: 'DELETE' });
  assert(delCat.status === 200, 'Deleted custom Category; products reassigned to "Khác"');

  const prodAfterCatDel = await request(`/products/${prodId}`);
  assert(
    prodAfterCatDel.data?.data?.category?.slug === 'khac',
    'Product category now points to "Khác" (slug: khac)'
  );

  // Delete Brand -> Reassigns product to "Khác"
  const delBrand = await request(`/brands/${brandId}`, { method: 'DELETE' });
  assert(delBrand.status === 200, 'Deleted custom Brand; products reassigned to "Khác"');

  const prodAfterBrandDel = await request(`/products/${prodId}`);
  assert(
    prodAfterBrandDel.data?.data?.brand === 'Khác',
    'Product brand now points to "Khác"'
  );

  // ----------------------------------------------------
  // 3. ORDER SERVICE (SNAPSHOT, FIXED SHIPPING > 1M, COUPON FREESHIP, STOCK DEDUCTION)
  // ----------------------------------------------------
  console.log('\n--- [3. ORDER SERVICE & SHIPPING RULES] ---');

  // Test 3.1: Order > 1 Million VND without coupon -> Shipping fee MUST NOT be 0 (Base 30,000 VND)
  const order1 = await request('/orders', {
    method: 'POST',
    body: JSON.stringify({
      user_id: 1,
      shipping_name: 'Nguyễn Văn Test',
      phone: '0901234567',
      shipping_address: '123 Đường Test, Quận 1, TP.HCM',
      items: [
        {
          product_id: prodId,
          price: 1500000,
          quantity: 2,
          size: 'XL',
          color: 'Đen'
        }
      ]
    })
  });

  const order1Data = order1.data?.data;
  assert(
    order1.status === 201 && order1Data && Number(order1Data.shipping_fee) === 30000 && Number(order1Data.subtotal) === 3000000 && Number(order1Data.total_amount) === 3030000,
    'Order > 1M without coupon has base shipping fee = 30,000 VND (NOT 0đ)',
    JSON.stringify(order1.data)
  );

  // Check Item Snapshot in Order
  const itemSnapshot = order1Data?.items?.[0];
  assert(
    itemSnapshot &&
    itemSnapshot.product_name === `Áo Khoác Bomber Test ${testId}` &&
    Number(itemSnapshot.unit_price) === 1500000 &&
    itemSnapshot.quantity === 2 &&
    itemSnapshot.variant_attributes?.size === 'XL' &&
    itemSnapshot.variant_attributes?.color === 'Đen',
    'Order item snapshot correctly stored product_name, unit_price, quantity, size & color',
    JSON.stringify(itemSnapshot)
  );

  // Verify stock in Catalog Service was deducted from 20 to 18
  const prodAfterOrder1 = await request(`/products/${prodId}`);
  assert(
    prodAfterOrder1.data?.data?.stock === 18,
    'Catalog stock was automatically deducted from 20 -> 18 inside order transaction',
    `Current stock: ${prodAfterOrder1.data?.data?.stock}`
  );

  // Test 3.2: Order with FREESHIP coupon -> Shipping fee becomes 0 VND
  const orderWithFreeship = await request('/orders', {
    method: 'POST',
    body: JSON.stringify({
      user_id: 1,
      shipping_name: 'Trần Thị Freeship',
      phone: '0909888777',
      shipping_address: '456 Lê Lợi, TP.HCM',
      coupon_code: 'FREESHIP',
      items: [
        {
          product_id: prodId,
          price: 1500000,
          quantity: 1,
          size: 'L',
          color: 'Xám'
        }
      ]
    })
  });
  const orderFreeshipData = orderWithFreeship.data?.data;
  assert(
    orderWithFreeship.status === 201 && orderFreeshipData && Number(orderFreeshipData.shipping_fee) === 0 && Number(orderFreeshipData.total_amount) === 1500000,
    'Order with FREESHIP coupon applies 0 VND shipping fee',
    JSON.stringify(orderWithFreeship.data)
  );

  // Verify stock again (18 -> 17)
  const prodAfterOrder2 = await request(`/products/${prodId}`);
  assert(
    prodAfterOrder2.data?.data?.stock === 17,
    'Catalog stock was deducted from 18 -> 17',
    `Current stock: ${prodAfterOrder2.data?.data?.stock}`
  );

  // ----------------------------------------------------
  // 4. PAYMENT SERVICE (SETTINGS & DYNAMIC VIETQR)
  // ----------------------------------------------------
  console.log('\n--- [4. PAYMENT SERVICE & DYNAMIC VIETQR] ---');

  // Update payment settings
  const updateSettings = await request('/payments/settings', {
    method: 'PUT',
    body: JSON.stringify({
      bank_code: 'MB',
      bank_name: 'MBBank',
      account_number: '0987654321',
      account_name: 'CONG TY CRS FASHION',
      template: 'compact2'
    })
  });
  assert(updateSettings.status === 200 && updateSettings.data.data.bank_code === 'MB', 'Updated payment settings in DB');

  // Generate dynamic VietQR
  const vietQrRes = await request('/payments/vietqr', {
    method: 'POST',
    body: JSON.stringify({
      amount: 1530000,
      description: 'CRS ORDER 100',
      order_id: 100
    })
  });
  assert(
    vietQrRes.status === 200 &&
    vietQrRes.data.data.qr_url.includes('https://img.vietqr.io/image/MB-0987654321-compact2.png') &&
    vietQrRes.data.data.account_name === 'CONG TY CRS FASHION',
    'Generated accurate dynamic VietQR Quick Link based on settings',
    JSON.stringify(vietQrRes.data)
  );

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
