import os
import uuid # 用來產生唯一的檔案名稱
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS # 引入 CORS
import tempfile # 使用 tempfile 模組更安全地處理暫存檔案
from processor_main import audio_to_dialect_text , diatest_to_token , token_to_sentence


# --- Flask App 設定 ---
app = Flask(__name__)
CORS(app) # 啟用 CORS，允許來自前端的請求

@app.route('/transcribe', methods=['POST'])

def transcribe_audio():
    """
    處理前端傳來的音檔和方言選擇，回傳辨識結果。
    """
    if 'audio_file' not in request.files:
        return jsonify({"error": "No audio file part"}), 400
    if 'dialect' not in request.form:
        return jsonify({"error": "No dialect selected"}), 400

    file = request.files['audio_file']
    dialect = request.form['dialect']

    # 基本的檔案檢查
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if not file.filename.lower().endswith('.mp3'):
         return jsonify({"error": "Invalid file type, only .mp3 allowed"}), 400

    # 驗證方言選項
    allowed_dialects = {"ami", "sdq", "trv"}
    if dialect not in allowed_dialects:
        return jsonify({"error": "Invalid dialect selected"}), 400

    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3", mode='wb') as temp_f:
            file.save(temp_f) 
            temp_file_path = temp_f.name 
        
        print(f"Temporary file saved at: {temp_file_path}") 

        # 呼叫核心處理函數
        transcription_result = audio_to_dialect_text(temp_file_path) # 把原住民語音轉成羅馬拼音
        print(transcription_result)
        if transcription_result is None or "Error" in str(transcription_result):
            return jsonify({"error": f"Transcription failed: {transcription_result}"}), 500

        chtoken = diatest_to_token(transcription_result, dialect) # 把羅馬拼音轉成中文token(陣列形式)

        result_sentence = token_to_sentence(chtoken) # 把中文token轉成句子

        if result_sentence is None or "Error" in str(result_sentence):
             return jsonify({"error": f"Transcription failed: {result_sentence}"}), 500
        else:
             return jsonify({"transcription": result_sentence})

    except Exception as e:
        print(f"Error processing file: {e}")
        return jsonify({"error": f"Server error processing file: {str(e)}"}), 500
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                print(f"Temporary file deleted: {temp_file_path}")
            except OSError as e:
                print(f"Error deleting temporary file {temp_file_path}: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)