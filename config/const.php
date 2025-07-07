<?php

return [
  'mail' => [
    'mail_a' => [
      'from' => env('MAIL_A_FROM', ''),
    ],
    'mail_b' => [
      'from' => env('MAIL_B_FROM', ''),
    ],
    'customer_id' => [
      'rivercrane' => env('CUSTOMER_ID_RIVERCRANE'),
    ],
    'error' => [
      'to' => env('MAIL_ERROR_TO'),
    ],
    'place_order' => [
      'bcc' => env('MAIL_PLACE_ORDER_BCC'),
    ]
  ],
  'init_customer' => [
    'name' => '上様',
    'fraction' => 3,
    'corporate_class' => 1,
  ],
  'paginate' => [
    'per_page' => 20,
  ],
  'paths' => [
    'customer' => [
      'output_path' => 'output/customer/',
    ],
    'estimate' => [
      'output_path' => 'output/estimate/',
    ],
    'hiden' => [
      'output_path' => 'output/hiden/',
    ],
    'home_data_import' => [
      'output_path' => 'output/home_data_import/',
    ],
    'inventory_import' => [
      'output_path' => 'output/inventory_import/',
    ],
    'inventory_printing' => [
      'output_path' => 'output/inventory_printing/',
    ],
    'invoice' => [
      'output_path' => 'output/invoice/',
    ],
    'item' => [
      'output_path' => 'output/item/',
    ],
    'place_order' => [
      'output_path' => 'output/place_order/',
    ],
    'receive_order' => [
      'output_path' => 'output/receive_order/',
    ],
    'shipment_plan' => [
      'output_path' => 'output/shipment_plan/',
    ],
    'sales' => [
      'output_path' => 'output/sales/',
    ],
  ],
  'invoice_no' => 'T8021001077811',
];
