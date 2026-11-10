這個資料夾只在「題庫或評分程式有改」時才需要用，平常學生用的網頁不需要它（可以不上傳）。

流程（需要 Node.js）：
  1. 在這個資料夾執行： npm init -y && npm i esbuild fflate fast-xml-parser image-size
  2. node build.js   → 重新產生 ../grader.js（把 ../../MOCC/lib 的評分程式打包成瀏覽器版）
  3. node gen.js     → 重新產生 ../data.js（把 ../../MOCC/rules 題庫、範本與解答圖路徑整理成一個檔）
修改題庫請改 MOCC/rules/*.json，再跑上面兩步。
