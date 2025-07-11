/**
 * @license
 * Copyright (c) 2025 Maeta Masaaki
 *
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 *
 * 本ソフトウェアは、MITライセンスの下で提供されています。
 * 改変は自由ですが、本ソフトウェアの使用によって生じた問題については、
 * 作者は一切の責任を負いません。
 */

/**
 * Webアプリにレイアウトデータを出力するサーバーサイド関数
 * @param {Array} seatData フロントエンドから送られてくる座席データの配列
 * @returns {string} 作成されたシート名
 */
function exportLayoutToSheet(seatData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = '席替えレイアウト_' + Utilities.formatDate(new Date(), "JST", "yyyyMMdd_HHmmss");
  
  const CELL_WIDTH_PIXELS = 100;
  const CELL_HEIGHT_PIXELS = 70;
  const SEAT_BLOCK_ROWS = 4;
  const SEAT_BLOCK_COLS = 2;

  let maxCol = 0;
  seatData.forEach(seat => {
    const col = 1 + Math.floor(seat.x / CELL_WIDTH_PIXELS) * SEAT_BLOCK_COLS + (SEAT_BLOCK_COLS - 1);
    if (col > maxCol) {
      maxCol = col;
    }
  });
  if (maxCol === 0) maxCol = 1;

  const newSheet = ss.insertSheet(sheetName, 0);
  const currentCols = newSheet.getMaxColumns();
  if (maxCol > currentCols) {
    newSheet.insertColumnsAfter(currentCols, maxCol - currentCols);
  }

  for (let i = 1; i <= maxCol; i++) {
    newSheet.setColumnWidth(i, CELL_WIDTH_PIXELS / SEAT_BLOCK_COLS);
  }

  seatData.forEach(seat => {
    const targetRow = 1 + Math.floor(seat.y / CELL_HEIGHT_PIXELS) * SEAT_BLOCK_ROWS;
    const targetCol = 1 + Math.floor(seat.x / CELL_WIDTH_PIXELS) * SEAT_BLOCK_COLS;
    
    const range = newSheet.getRange(targetRow, targetCol, SEAT_BLOCK_ROWS, SEAT_BLOCK_COLS);
    range.merge();
    
    const cellText = `席 ${seat.id}\n${seat.student || '（空席）'}`;
    range.setValue(cellText);
    
    range.setHorizontalAlignment('center')
         .setVerticalAlignment('middle')
         .setWrap(true)
         .setFontWeight('bold');

    range.setBackground(seat.student ? '#cfe2f3' : '#f3f3f3');

    if (seat.isLocked) {
      range.setBorder(true, true, true, true, true, true, '#9333ea', SpreadsheetApp.BorderStyle.SOLID_THICK);
    } else {
      range.setBorder(true, true, true, true, true, true, '#b7b7b7', SpreadsheetApp.BorderStyle.SOLID);
    }
  });
  
  newSheet.activate();
  return newSheet.getName();
}


function setupRosterSheet() {
  const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();
  const SHEET_NAME = '名簿';
  if (SPREADSHEET.getSheetByName(SHEET_NAME)) { return; }
  const sampleStudents = [
    ['鈴木 一郎'], ['佐藤 次郎'], ['高橋 三郎'], ['田中 四郎'], ['伊藤 五郎'],
    ['渡辺 六郎'], ['山本 七郎'], ['中村 八郎'], ['小林 九郎'], ['加藤 十郎'],
    ['吉田 花子'], ['山田 桃子'], ['佐々木 桜'], ['松本 楓'], ['井上 あやめ'],
    ['木村 蓮'],   ['林 陽菜'],   ['斎藤 葵'],   ['清水 結衣'], ['山崎 美咲']
  ];
  const sheet = SPREADSHEET.insertSheet(SHEET_NAME, 0);
  sheet.getRange('A1').setValue('氏名').setFontWeight('bold');
  sheet.getRange('A2:A' + (sampleStudents.length + 1)).setValues(sampleStudents);
  sheet.setColumnWidth(1, 150);
  SpreadsheetApp.flush();
}

function getStudentsFromSheet() {
  setupRosterSheet();
  const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();
  const SHEET_NAME = '名簿';
  const sheet = SPREADSHEET.getSheetByName(SHEET_NAME);
  if (!sheet) { throw new Error(`「${SHEET_NAME}」という名前のシートの作成に失敗しました。`); }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { return []; }
  const range = sheet.getRange('A2:A' + lastRow);
  const values = range.getValues();
  const studentNames = values.map(row => row[0].toString().trim()).filter(name => name !== '');
  return studentNames;
}

function doGet() {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('席替えアプリ')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
