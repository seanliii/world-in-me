// 入口不依赖其他模块，才能在模块网络加载失败时提供可用恢复入口。
import('./app.mjs').catch(() => {
  const main = document.getElementById('main');
  const shell = document.createElement('section');
  shell.className = 'page-shell empty-page';
  const heading = document.createElement('h1');
  heading.textContent = '页面程序没有完整加载';
  const message = document.createElement('p');
  message.textContent = '可能是网络连接中断。你的本地笔记没有被删除，可以重新打开，或直接阅读文字总稿。';
  const retry = document.createElement('a');
  retry.href = './';
  retry.className = 'button';
  retry.textContent = '重新打开网页';
  const manuscript = document.createElement('a');
  manuscript.href = 'research/研究总稿.md';
  manuscript.textContent = '打开文字研究总稿';
  shell.append(heading, message, retry, manuscript);
  main.replaceChildren(shell);
  main.dataset.loadError = 'true';
});
