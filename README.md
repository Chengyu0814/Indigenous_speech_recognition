# 族語稀為貴 - 使用手冊

## 目錄
1. [專案簡介](#專案簡介)
2. [系統需求](#系統需求)
3. [安裝與設定](#安裝與設定)
4. [使用方法](#使用方法)
5. [系統架構](#系統架構)
6. [詢問方法](#詢問方法)

## 專案簡介
本專案是一個原住民族語音辨識系統，能夠將原住民語言的語音轉換為中文文字。目前支援三種原住民語言：阿美語(Amis)、賽德克語(Seediq)和太魯閣語(Truku)。

## 系統需求
- Python 3.7 或更高版本
- 網際網路連線（用於API呼叫）

## 安裝與設定

### 1. 複製專案
```bash
git clone https://github.com/Chengyu0814/Indigenous_speech_recognition.git
cd Indigenous_speech_recognition
```

### 2. 設置後端環境

#### 建立虛擬環境
```bash
# 在專案根目錄執行
# 使用 venv 建立虛擬環境
python -m venv venv

# 啟動虛擬環境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

#### 安裝後端Library
```bash
cd backend
pip install -r requirements.txt
```

#### 啟動後端服務
```bash
# 在 backend 目錄下執行
python3 app.py
or 
python app.py
```
後端服務將在 http://localhost:5000 啟動。

### 3. 設置前端環境

前端為純靜態網頁，不需要額外安裝套件。可以使用任何HTTP伺服器提供服務。


## 使用方法

### 1. 啟動系統
- 啟動後端服務：在 backend 目錄執行 `python app.py` or `python3 app.py`
- 啟動前端服務：使用HTTP伺服器提供frontend目錄的服務
    1. `cd frontend` 到 frontend目錄
    2. ```bash
        # Windows 打開HTML檔案
        start index.html
        # MacOS
        open index.html
### 2. 使用界面
1. 選擇要上傳的MP3格式語音檔案
2. 從下拉選單中選擇語言類型（阿美語、賽德克語或太魯閣語）
3. 點擊「開始辨識」按鈕
4. 等待處理完成，系統將顯示辨識結果

## 系統架構

本系統分為前端和後端兩部分：

### 前端
- 使用HTML、CSS和JavaScript構建
- 提供使用者介面，允許上傳音訊檔案和選擇語言
- 透過AJAX與後端通訊

### 後端
- 使用Flask框架構建的RESTful API
- 處理前端提交的音訊檔案
- 使用外部API進行語音辨識處理
- 將原住民語音轉換為中文

## 主要功能流程
1. 使用者上傳原住民語音檔案（MP3格式）
2. 系統將檔案傳送至後端處理
3. 後端使用AI模型將語音轉換為羅馬拼音文字
4. 系統將羅馬拼音轉換為中文單字
5. 使用LLM(LLaMa 3.3 70b)將中文單字組成通順的中文句子
6. 返回最終的辨識結果給使用者


## 詢問方法
Email : 113356042@g.nccu.edu.tw

