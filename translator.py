import json
from googletrans import Translator
import time

translator = Translator()

with open('data/taipei-attractions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    attractions = data['result']['results']

fields_to_translate = ['name', 'CAT', 'address', 'description', 'MEMO_TIME', 'MRT', 'direction']

MAX_RETRIES = 3

for item in attractions:
    for field in fields_to_translate:
        if field in item and item[field]:
            retries = 0
            while retries < MAX_RETRIES:
                try:
                    text_to_translate = item[field].strip()  
                    translated_text = translator.translate(text_to_translate, src='zh-TW', dest='en').text
                    print(f"原文: {text_to_translate}, 翻譯後: {translated_text}")
                    item[field] = translated_text
                    time.sleep(2)  
                    break  
                except Exception as e:
                    retries += 1
                    print(f"翻譯 {field} 發生錯誤，重試 {retries}/{MAX_RETRIES}: {e}")
                    time.sleep(2)  
                    if retries == MAX_RETRIES:
                        print(f"翻譯 {field} 最終失敗，保留原文")

data['result']['results'] = attractions

with open('taipei-attractions-en.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("翻譯完成並保存為 'taipei-attractions-en.json'")