# CartyFinds Supabase Edge Function

This folder contains a Supabase Edge Function for creating customer orders securely on the server.

Files
- `index.ts` - Edge Function that validates order payloads and inserts rows into `public.orders`

Deployment
1. Install the Supabase CLI if needed:
   npm install -g supabase

2. Log in:
   supabase login

3. Link the project:
   supabase link --project-ref <YOUR_PROJECT_REF>

4. Set the service role key as a function secret:
   supabase secrets set SUPABASE_SECRET_KEY=<YOUR_SERVICE_ROLE_SECRET> --project-ref <YOUR_PROJECT_REF>

5. Deploy the function:
   supabase functions deploy create-order --project-ref <YOUR_PROJECT_REF>

6. Test the deployed function:
   curl -X POST 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/create-order' \
     -H 'Content-Type: application/json' \
     -H 'Origin: https://craftyfinds.github.io' \
     -d '{
       "customer_name":"Guest Tester",
       "customer_email":"test@example.com",
       "customer_phone":"9999999999",
       "items":[
         {"product_id":"p1","title":"Hand Juicer","qty":2,"unit_price":299,"line_total":598},
         {"product_id":"p2","title":"Travel Pouch","qty":1,"unit_price":199,"line_total":199}
       ],
       "shipping_fee":0
     }'

Important notes
- The service role secret must be stored only in the Supabase function environment, not in browser JS.
- Keep the function behind a rate limit and origin validation in production.
- After verifying the function, remove any public/anon insert policy on `public.orders` if it is still enabled for demo testing.

Recommended SQL to remove demo insert access after testing:
```sql
drop policy if exists "allow public order creation for demo checkout" on public.orders;
```

