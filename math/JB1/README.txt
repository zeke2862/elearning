JB1 v4 更新包（只含有改動的檔案）
==================================
放置方式：把本資料夾內的檔案「直接覆蓋」到遊戲資料夾（和 world-map.html 同一層）。
  mode-system.js / bgm.js / sfx.js(新增) / world-map.html / world-map-teacher.html
  BGM_prompts.md、SFX_list.md 是說明文件，不用放進遊戲。
（上一包的 game-config.js、config-editor.html、relax-break.bundle.js 沒有再改，保留即可）

這次的改動
1. 最後一題答完也會跳休息小遊戲（但血量歸零失敗時、解救戰俘不會跳）。
2. 背景音樂：有放 mp3 就播 mp3，沒放就用內建合成音樂（不會壞）。
   mp3 放在 audio/bgm/ ，檔名見 BGM_prompts.md（lobby.mp3、map.mp3、stage-1-1.mp3 …）。
3. 新增 sfx.js：43 種音效（按鈕、答對答錯、攻擊、治療、寶箱…），全部合成、免音檔。
