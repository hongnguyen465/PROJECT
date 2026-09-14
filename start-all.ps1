npx concurrently -n "GATEWAY,AUTH,CATALOG,ORDER,PAY,RECOM,FRONTEND" `
  -c "blue,magenta,yellow,cyan,blue,red,green" `
  "cd api-gateway && php artisan serve --port=8000" `
  "cd auth-service && php artisan serve --port=8001" `
  "cd catalog-service && php artisan serve --port=8002" `
  "cd order-service && php artisan serve --port=8003" `
  "cd payment-service && php artisan serve --port=8004" `
  "cd recommendation-service && php artisan serve --port=8005" `
  "cd crs-frontend && npm run dev"