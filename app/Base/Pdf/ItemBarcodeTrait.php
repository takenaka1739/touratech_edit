<?php

namespace App\Base\Pdf;

trait ItemBarcodeTrait
{
  protected $x_width = 70.0;

  protected $y_height = 33.9;

  /** @var bool */
  public $debug = false;

  /** @var \App\Base\Pdf\PdfWrapper */
  protected $pdf;

  /** @var bool */
  public $isPrintPrice = false;

  /**
   * ラベルの書き込み
   *
   * @param float $x X座標
   * @param float $y Y座標
   * @param string $item_number 品番
   * @param string $name 商品名
   * @param int $sales_unit_price 売上単価
   */
  protected function writeLabel(
    float $x,
    float $y,
    string $item_number,
    $name,
    $sales_unit_price,
    int $index
  )
  {
    if ($index == 1) {
      $x = $x + 1;
    }
    if ($index == 3) {
      $x = $x - 2;
    }

    if ($this->debug) {
      $this->pdf->lineNormal();
      $this->pdf->setDrawColor(255, 0, 0);
      $this->pdf->Rect($x, $y, $this->x_width - 0.1, $this->y_height - 0.1);
      $this->pdf->setDrawColor(0, 0, 0);
    }

    if (!empty($name)) {
      $name1 = mb_substr($name, 0, 14, "UTF-8");
      $name2 = mb_substr($name, 14, 22, "UTF-8");

      // 商品名
      $this->pdf->SetFont('meiryob', "B");
      if ($name1) {
        $this->pdf->SetFontSize(13);
        $this->pdf->SetXY($x + 2, $y + 2);
        $this->pdf->Cell($this->x_width - 4, 6, $name1);

        if ($name2) {
          $this->pdf->SetFontSize(8);
          $this->pdf->SetXY($x + 2, $y + 10);
          $this->pdf->Cell($this->x_width - 4, 6, $name2);
        }
      }
    }

    if ($this->isPrintPrice) {
      // 税込価格
      $this->pdf->SetFont('meiryob', "B");
      $this->pdf->SetFontSize(11);
      $this->pdf->SetXY($x + 50, $y + 20);
      if (!empty($sales_unit_price)) {
        $this->pdf->Cell(19, 3, "￥" . number_format($sales_unit_price, 0), 0, 0, "R");
      }

      // 線
      $this->pdf->lineW($x + 48, $y + 24.5, 20);

      $this->pdf->SetXY($x + 50, $y + 25);
      $this->pdf->Cell(19, 3, "（税込）", 0, 0, "C");
    }


    $this->pdf->write1DBarcode($item_number, "C128B", $x + 4, $y + 20, 40, 11.5, 0.26, [
      'align' => 'C',
      'stretch' => true,
      'fgcolor' => array(0, 0, 0),
      'bgcolor' => false,
      'text' => true,
      'font' => 'helvetica',
      'fontsize' => 7,
      'stretchtext' => 4
    ]);
  }
}
