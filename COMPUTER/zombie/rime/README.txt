This folder contains the RIME input method engine (librime, compiled to WebAssembly by the
LibreService "My RIME" project, AGPL-3.0-or-later) and the 朙月拼音 (luna_pinyin) schema/dictionary
from rime-luna-pinyin. It is the same engine that powers 小狼毫 (Weasel), bundled so the game can offer
a real Rime input method with nothing to install. Sources:
  https://github.com/LibreService/my_rime
  https://github.com/rime/librime
  https://github.com/rime/rime-luna-pinyin
The files asset-*.js are the binary data files encoded as base64 so the game also works when
index.html is opened directly from disk (no web server needed).
