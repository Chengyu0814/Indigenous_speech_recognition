import os
from gradio_client import Client, handle_file
import tempfile 
import requests
import xml.etree.ElementTree as ET
import json
from groq import Groq


def audio_to_dialect_text(path):
    """
    Args:
        path (str): 音檔的路徑。
    Returns:
        str: 辨識出的文字結果，或發生錯誤時回傳 None 或錯誤訊息。
    """
    try:
        client = Client("https://sapolita.ithuan.tw/")
        result = client.predict(
                model_id="whisper-large-v2-all",
                dialect_id="test",
                audio_file=handle_file(path),
                api_name="/predict"
        )
        return result
    except Exception as e:
        print(f"Error calling Gradio API: {e}")
        return f"API Error: {str(e)}"
    
def vocab_search(language,word): # 阿美是1 賽德克是15 太魯閣是33 # 回傳list前三個單字
    url = "https://web.klokah.tw/api/multiSearchResult.php"
    params = {
        "d": language,         
        "txt": word,
        "type": "cu"
    }

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    response = requests.get(url, params=params, headers=headers)
    response.encoding = "utf-8"

    try:
        root = ET.fromstring(response.text)
        items = root.findall(".//item")
        list_two = []

        for item in items:
            text = item.find("text").text if item.find("text") is not None else ""
            chinese = item.find("chinese").text if item.find("chinese") is not None else ""
            if len(list_two) <3:
                list_two.append(chinese)
            
        return list_two
    except Exception as e:
        print(response.text)
   
def diatest_to_token(result , dialect): # 把羅馬拼音轉成中文token(陣列形式)
    if dialect == "ami":
        language_num = 1
    elif dialect =="sdq":
        language_num = 15
    elif dialect == "trv":
        language_num = 33
    
    sentence = result.split()
    list_total = []
    for word in sentence:
        list_total.append(vocab_search(language_num,word))

    return list_total
    
def token_to_sentence(sub_list): # 把中文token轉成句子

    client = Groq(api_key="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")
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", 
                "content":"""你好，可以幫我把以下list轉換成一個你覺得比較合理的句子嗎？是由不同小list組成，可以在各個小list中選擇一個你覺得比較合理的單字，
                        並且把這些句子組成一個你覺得比較合理的句子嗎，你可以自行更改順序或選擇不用哪些單字也可以自行改成你覺得更合理的句子，
                        像是example_list = [ ['你好', '哈囉', '嗨'], ['朋友', '你', '你們'], ['學校', '這裡', '教室'], ['今天', '現在', '此刻'], ['要做什麼', '要去哪裡', '打算做什麼'], ['語助詞', '主格標記', 'undefined'] ]，則可以生成 ： 嗨 你今天在學校要做什麼？，
                        請幫我回傳你覺得最合理的句子，並且只需要回傳句子就行了，不用多做任何說明，以下是list：""" + str(sub_list)}],
        temperature=0,
        max_completion_tokens=1024,
        top_p=1,
        stream=True,
        stop=None,
    )


    # 解析與輸出
    try:
        response_text = ""
        for chunk in completion:
            response_text += chunk.choices[0].delta.content or ""

        return response_text
    except Exception as e:
        return "❌ 模型發生錯誤"