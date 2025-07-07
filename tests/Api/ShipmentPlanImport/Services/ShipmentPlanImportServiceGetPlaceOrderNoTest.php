<?php

namespace Tests\Api\ShipmentPlanImport\Services;

use App\Api\ShipmentPlanImport\Services\ShipmentPlanImportService;
use ReflectionClass;
use Tests\TestCase;

class ShipmentPlanImportServiceGetPlaceOrderNoTest extends TestCase
{
  protected $service;
  protected $method;

  public function setUp(): void
  {
    parent::setUp();

    $this->service = new ShipmentPlanImportService();
    $refrection = new ReflectionClass($this->service);
    $this->method = $refrection->getMethod('getPlaceOrderNo');
    $this->method->setAccessible(true);
  }

  public function testSuccessNoData()
  {
    $text = "";
    $actual = $this->method->invoke($this->service, $text);

    $this->assertEquals(null, $actual);
  }

  public function testSuccess1()
  {
    $text = "  Your order: Order_1802351_200621.csv  ";
    $actual = $this->method->invoke($this->service, $text);

    $this->assertEquals('Order_1802351_200621.csv', $actual);
  }

  public function testSuccess2()
  {
    $text = "  Your order from file: Order_1802351_200420.csv  ";
    $actual = $this->method->invoke($this->service, $text);

    $this->assertEquals('Order_1802351_200420.csv', $actual);
  }

  public function testSuccess3()
  {
    $text = "---------------------------------------------------\n
Rucksack COR13,\n
13 Liter, schwarz,\n
by Touratech Waterproof\n
\n
Your order: Order_1802351_200621.csv\n
---------------------------------------------------";
    $actual = $this->method->invoke($this->service, $text);

    $this->assertEquals('Order_1802351_200621.csv', $actual);
  }

  public function testFail()
  {
    $text = "  Your Order: order_18102351_200601.csv  ";
    $actual = $this->method->invoke($this->service, $text);

    $this->assertEquals(null, $actual);
  }

}