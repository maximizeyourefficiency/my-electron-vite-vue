import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('api', {
  path: async () => {
    const path = document.getElementById('dbpath').value
    const isuri = document.getElementById('isuri').checked
    const autocommit = document.getElementById('autocommit').checked
    try {
      const res = await ipcRenderer.invoke('connect', path, isuri, autocommit);
      document.getElementById('pout').innerText = 'Output: ' + res;
    } catch (error) {
      document.getElementById('pout').innerText = 'Output: ' + error;
    }
  },
  equery: async () => {
    const query = document.getElementById('singlequery').value
    const values = document.getElementById('value').value
    try {
      const arr = JSON.parse("[" + values + "]");
      const res = await ipcRenderer.invoke('executeQuery', query, arr[0]);
      document.getElementById('pout1').innerText = 'Output: ' + res;
    } catch (error) {
      document.getElementById('pout1').innerText = 'Output: ' + error;
    }
  },
  fetchall: async () => {
    const query = document.getElementById('fetchallquery').value
    const values = document.getElementById('fetchallvalue').value
    try {
      const arr = JSON.parse("[" + values + "]");
      const res = await ipcRenderer.invoke('fetchall', query, arr[0]);
      document.getElementById('poutfa').innerText = 'Output: ' + JSON.stringify(res);
    } catch (error) {
      document.getElementById('poutfa').innerText = 'Output: ' + error;
    }
  },
  fetchone: async () => {
    const query = document.getElementById('fetchonequery').value
    const values = document.getElementById('fetchonevalue').value
    try {
      const arr = JSON.parse("[" + values + "]");
      const res = await ipcRenderer.invoke('fetchone', query, arr[0]);
      document.getElementById('poutfo').innerText = 'Output: ' + JSON.stringify(res);
    } catch (error) {
      document.getElementById('poutfo').innerText = 'Output: ' + error;
    }
  },
  fetchmany: async () => {
    const query = document.getElementById('fetchmanyquery').value
    const values = document.getElementById('fetchmanyvalue').value
    const size = Number(document.getElementById('fetchmanysize').value)
    try {
      const arr = JSON.parse("[" + values + "]");
      const res = await ipcRenderer.invoke('fetchmany', query, size, arr[0]);
      document.getElementById('poutfm').innerText = 'Output: ' + JSON.stringify(res);
    } catch (error) {
      document.getElementById('poutfm').innerText = 'Output: ' + error;
    }
  },
  mquery: async () => {
    const query = document.getElementById('query').value
    const values = document.getElementById('values').value
    try {
      const arr = JSON.parse("[" + values + "]");
      const res = await ipcRenderer.invoke('executeMany', query, arr[0]);
      document.getElementById('pout2').innerText = 'Output: ' + res;
    } catch (error) {
      document.getElementById('pout2').innerText = 'Output: ' + error;
    }
  },
  escript: async () => {
    const spath = document.getElementById('scriptPath').value
    const res = await ipcRenderer.invoke('executeScript', spath);
    document.getElementById('pout3').innerText = 'Output: ' + res;
  },
  load_extension: async () => {
    const path = document.getElementById('extensionPath').value
    const res = await ipcRenderer.invoke('load_extension', path);
    console.log(res);
    document.getElementById('pout4').innerText = 'Output: ' + res;
  },
  backup: async () => {
    const target = document.getElementById('backupPath').value
    const pages = document.getElementById('pages').value
    const name = document.getElementById('name').value
    const sleep = document.getElementById('sleep').value
    const res = await ipcRenderer.invoke('backup', target, pages, name, sleep);
    console.log(res);
    document.getElementById('pout5').innerText = 'Output: ' + res;
  },
  iterdump: async () => {
    const path = document.getElementById('iterdumpPath').value
    const filter = document.getElementById('iterdumpFilter').value
    const res = await ipcRenderer.invoke('iterdump', path, filter);
    console.log(res);
    document.getElementById('pout6').innerText = 'Output: ' + res;
  }
})



// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)
