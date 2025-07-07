<?php

namespace App\Base\Pdf;

use TCPDF;
use TCPDF_STATIC;
use TCPDFBarcode;

/**
 * TCPDFのラッパークラス
 */
class PdfWrapper extends TCPDF
{
	protected $line_style_width_normal = 0.106;

	protected $line_style_width_bold = 0.425;

	protected $font_subsetting = false;

	/**
	 * コンストラクタ
	 */
	public function __construct(
		$title,
		$orientation='P',
		$unit='mm',
		$format='A4',
		$unicode=true,
		$encoding='UTF-8',
		$diskcache=false,
		$pdfa=false

	)
	{
		parent::__construct(
			$orientation,
			$unit,
			$format,
			$unicode,
			$encoding,
			$diskcache,
			$pdfa
		);
		$this->setPDFVersion('1.3');
		$this->SetTitle($title);
		$this->SetAuthor("ツアラテックジャパン");
		$this->setPrintHeader(false);
		$this->setPrintFooter(false);
		$this->SetMargins(0, 0, 0);
		$this->SetAutoPageBreak(false);
	}

	/**
	 * @param float $width
	 */
	public function setLineStyleWidthNormal(float $width)
	{
		$this->line_style_width_normal = $width;
	}

	/**
	 * @param float $width
	 */
	public function setLineStyleWidthBold(float $width)
	{
		$this->line_style_width_bold = $width;
	}

	/**
	 * 右上を基準に文字を出力する
	 *
	 * @param float $x 右上のX座標
	 * @param float $y 右上のY座標
	 * @param string $txt 文字列
	 */
	public function TextRight($x, $y, $txt)
	{
		$this->SetXY($x, $y);
		$this->Cell(1, 0, $txt, 0, 0, 'R');
	}

	/**
	 * 横線を出力する
	 *
	 * @param float $x 左上のX座標
	 * @param float $y 左上のY座標
	 * @param float $w 横線の長さ
	 * @param array $style
	 */
	public function lineW($x, $y, $w, array $style = [])
	{
		$this->Line($x, $y, $x + $w, $y, $style);
	}

	/**
	 * 縦線を出力する
	 *
	 * @param float $x 左上のX座標
	 * @param float $y 左上のY座標
	 * @param float $h 縦線の長さ
	 * @param array $style
	 */
	public function lineH($x, $y, $h, array $style = [])
	{
		$this->Line($x, $y, $x, $y + $h, $style);
	}

	/**
	 * 基本の線の太さを設定する
	 */
	public function lineNormal()
	{
		$this->SetLineStyle(['width' => $this->line_style_width_normal]);
	}

	/**
	 * 太い線を設定する
	 */
	public function lineBold()
	{
		$this->SetLineStyle(['width' => $this->line_style_width_bold]);
	}


	/**
	 * TCPDFのwrite1DBarcodeをオーバーライドし、線の幅を細くする
	 *
	 * @link https://www.okushin.co.jp/kodanuki_note/2015/06/tcpdfcode39.html
	 */
	public function write1DBarcode($code, $type, $x='', $y='', $w='', $h='', $xres='', $style=array(), $align='') {
		if (TCPDF_STATIC::empty_string(trim($code))) {
			return;
		}
		// require_once(dirname(__FILE__).'/tcpdf_barcodes_1d.php');
		// save current graphic settings
		$gvars = $this->getGraphicVars();
		// create new barcode object
		$barcodeobj = new TCPDFBarcode($code, $type);
		$arrcode = $barcodeobj->getBarcodeArray();
		if (($arrcode === false) OR empty($arrcode) OR ($arrcode['maxw'] <= 0)) {
			$this->Error('Error in 1D barcode string');
		}
		if ($arrcode['maxh'] <= 0) {
			$arrcode['maxh'] = 1;
		}
		// set default values
		if (!isset($style['position'])) {
			$style['position'] = '';
		} elseif ($style['position'] == 'S') {
			// keep this for backward compatibility
			$style['position'] = '';
			$style['stretch'] = true;
		}
		if (!isset($style['fitwidth'])) {
			if (!isset($style['stretch'])) {
				$style['fitwidth'] = true;
			} else {
				$style['fitwidth'] = false;
			}
		}
		if ($style['fitwidth']) {
			// disable stretch
			$style['stretch'] = false;
		}
		if (!isset($style['stretch'])) {
			if (($w === '') OR ($w <= 0)) {
				$style['stretch'] = false;
			} else {
				$style['stretch'] = true;
			}
		}
		if (!isset($style['fgcolor'])) {
			$style['fgcolor'] = array(0,0,0); // default black
		}
		if (!isset($style['bgcolor'])) {
			$style['bgcolor'] = false; // default transparent
		}
		if (!isset($style['border'])) {
			$style['border'] = false;
		}
		$fontsize = 0;
		if (!isset($style['text'])) {
			$style['text'] = false;
		}
		if ($style['text'] AND isset($style['font'])) {
			if (isset($style['fontsize'])) {
				$fontsize = $style['fontsize'];
			}
			$this->SetFont($style['font'], '', $fontsize);
		}
		if (!isset($style['stretchtext'])) {
			$style['stretchtext'] = 4;
		}
		if ($x === '') {
			$x = $this->x;
		}
		if ($y === '') {
			$y = $this->y;
		}
		// check page for no-write regions and adapt page margins if necessary
		list($x, $y) = $this->checkPageRegions($h, $x, $y);
		if (($w === '') OR ($w <= 0)) {
			if ($this->rtl) {
				$w = $x - $this->lMargin;
			} else {
				$w = $this->w - $this->rMargin - $x;
			}
		}
		// padding
		if (!isset($style['padding'])) {
			$padding = 0;
		} elseif ($style['padding'] === 'auto') {
			$padding = 10 * ($w / ($arrcode['maxw'] + 20));
		} else {
			$padding = floatval($style['padding']);
		}
		// horizontal padding
		if (!isset($style['hpadding'])) {
			$hpadding = $padding;
		} elseif ($style['hpadding'] === 'auto') {
			$hpadding = 10 * ($w / ($arrcode['maxw'] + 20));
		} else {
			$hpadding = floatval($style['hpadding']);
		}
		// vertical padding
		if (!isset($style['vpadding'])) {
			$vpadding = $padding;
		} elseif ($style['vpadding'] === 'auto') {
			$vpadding = ($hpadding / 2);
		} else {
			$vpadding = floatval($style['vpadding']);
		}
		// calculate xres (single bar width)
		$max_xres = ($w - (2 * $hpadding)) / $arrcode['maxw'];
		if ($style['stretch']) {
			$xres = $max_xres;
		} else {
			if (TCPDF_STATIC::empty_string($xres)) {
				$xres = (0.141 * $this->k); // default bar width = 0.4 mm
			}
			if ($xres > $max_xres) {
				// correct xres to fit on $w
				$xres = $max_xres;
			}
			if ((isset($style['padding']) AND ($style['padding'] === 'auto'))
				OR (isset($style['hpadding']) AND ($style['hpadding'] === 'auto'))) {
				$hpadding = 10 * $xres;
				if (isset($style['vpadding']) AND ($style['vpadding'] === 'auto')) {
					$vpadding = ($hpadding / 2);
				}
			}
		}
		if ($style['fitwidth']) {
			$wold = $w;
			$w = (($arrcode['maxw'] * $xres) + (2 * $hpadding));
			if (isset($style['cellfitalign'])) {
				switch ($style['cellfitalign']) {
					case 'L': {
						if ($this->rtl) {
							$x -= ($wold - $w);
						}
						break;
					}
					case 'R': {
						if (!$this->rtl) {
							$x += ($wold - $w);
						}
						break;
					}
					case 'C': {
						if ($this->rtl) {
							$x -= (($wold - $w) / 2);
						} else {
							$x += (($wold - $w) / 2);
						}
						break;
					}
					default : {
						break;
					}
				}
			}
		}
		$text_height = $this->getCellHeight($fontsize / $this->k);
		// height
		if (($h === '') OR ($h <= 0)) {
			// set default height
			$h = (($arrcode['maxw'] * $xres) / 3) + (2 * $vpadding) + $text_height;
		}
		$barh = $h - $text_height - (2 * $vpadding);
		if ($barh <=0) {
			// try to reduce font or padding to fit barcode on available height
			if ($text_height > $h) {
				$fontsize = (($h * $this->k) / (4 * $this->cell_height_ratio));
				$text_height = $this->getCellHeight($fontsize / $this->k);
				$this->SetFont($style['font'], '', $fontsize);
			}
			if ($vpadding > 0) {
				$vpadding = (($h - $text_height) / 4);
			}
			$barh = $h - $text_height - (2 * $vpadding);
		}
		// fit the barcode on available space
		list($w, $h, $x, $y) = $this->fitBlock($w, $h, $x, $y, false);
		// set alignment
		$this->img_rb_y = $y + $h;
		// set alignment
		if ($this->rtl) {
			if ($style['position'] == 'L') {
				$xpos = $this->lMargin;
			} elseif ($style['position'] == 'C') {
				$xpos = ($this->w + $this->lMargin - $this->rMargin - $w) / 2;
			} elseif ($style['position'] == 'R') {
				$xpos = $this->w - $this->rMargin - $w;
			} else {
				$xpos = $x - $w;
			}
			$this->img_rb_x = $xpos;
		} else {
			if ($style['position'] == 'L') {
				$xpos = $this->lMargin;
			} elseif ($style['position'] == 'C') {
				$xpos = ($this->w + $this->lMargin - $this->rMargin - $w) / 2;
			} elseif ($style['position'] == 'R') {
				$xpos = $this->w - $this->rMargin - $w;
			} else {
				$xpos = $x;
			}
			$this->img_rb_x = $xpos + $w;
		}
		$xpos_rect = $xpos;
		if (!isset($style['align'])) {
			$style['align'] = 'C';
		}
		switch ($style['align']) {
			case 'L': {
				$xpos = $xpos_rect + $hpadding;
				break;
			}
			case 'R': {
				$xpos = $xpos_rect + ($w - ($arrcode['maxw'] * $xres)) - $hpadding;
				break;
			}
			case 'C':
			default : {
				$xpos = $xpos_rect + (($w - ($arrcode['maxw'] * $xres)) / 2);
				break;
			}
		}
		$xpos_text = $xpos;
		// barcode is always printed in LTR direction
		$tempRTL = $this->rtl;
		$this->rtl = false;
		// print background color
		if ($style['bgcolor']) {
			$this->Rect($xpos_rect, $y, $w, $h, $style['border'] ? 'DF' : 'F', '', $style['bgcolor']);
		} elseif ($style['border']) {
			$this->Rect($xpos_rect, $y, $w, $h, 'D');
		}
		// set foreground color
		$this->SetDrawColorArray($style['fgcolor']);
		$this->SetTextColorArray($style['fgcolor']);
		// print bars
		foreach ($arrcode['bcode'] as $k => $v) {
			$bw = ($v['w'] * $xres);
			if ($v['t']) {
				// draw a vertical bar
				$ypos = $y + $vpadding + ($v['p'] * $barh / $arrcode['maxh']);
				// 幅を狭くする場合は、下を使用する
				$this->Rect($xpos, $ypos, $bw, ($v['h'] * $barh / $arrcode['maxh']), 'F', array(), $style['fgcolor']);
				// $this->Rect($xpos, $ypos, $bw - 0.02, ($v['h'] * $barh / $arrcode['maxh']), 'F', array(), $style['fgcolor']);
			}
			$xpos += $bw;
		}
		// print text
		if ($style['text']) {
			if (isset($style['label']) AND !TCPDF_STATIC::empty_string($style['label'])) {
				$label = $style['label'];
			} else {
				$label = $code;
			}
			$txtwidth = ($arrcode['maxw'] * $xres);
			if ($this->GetStringWidth($label) > $txtwidth) {
				$style['stretchtext'] = 2;
			}
			// print text
			$this->x = $xpos_text;
			$this->y = $y + $vpadding + $barh;
			$cellpadding = $this->cell_padding;
			$this->SetCellPadding(0);
			$this->Cell($txtwidth, '', $label, 0, 0, 'C', false, '', $style['stretchtext'], false, 'T', 'T');
			$this->cell_padding = $cellpadding;
		}
		// restore original direction
		$this->rtl = $tempRTL;
		// restore previous settings
		$this->setGraphicVars($gvars);
		// set pointer to align the next text/objects
		switch($align) {
			case 'T':{
				$this->y = $y;
				$this->x = $this->img_rb_x;
				break;
			}
			case 'M':{
				$this->y = $y + round($h / 2);
				$this->x = $this->img_rb_x;
				break;
			}
			case 'B':{
				$this->y = $this->img_rb_y;
				$this->x = $this->img_rb_x;
				break;
			}
			case 'N':{
				$this->SetY($this->img_rb_y);
				break;
			}
			default:{
				break;
			}
		}
		$this->endlinex = $this->img_rb_x;
	}

}