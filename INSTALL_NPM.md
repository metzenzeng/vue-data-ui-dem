# 安装 npm 和 Node.js 指南

npm (Node Package Manager) 是随 Node.js 一起安装的。在 Windows 上安装 Node.js 后，npm 会自动安装。

## 方法一：使用官方安装程序（推荐）

1. **访问 Node.js 官网**
   - 打开浏览器访问：https://nodejs.org/
   - 下载 LTS（长期支持）版本，这是最稳定的版本

2. **运行安装程序**
   - 双击下载的 `.msi` 文件
   - 按照安装向导完成安装
   - 确保勾选 "Add to PATH" 选项

3. **验证安装**
   - 打开新的命令提示符（CMD）或 PowerShell
   - 运行以下命令验证：
     ```bash
     node --version
     npm --version
     ```

## 方法二：使用包管理器

### 使用 Chocolatey（如果已安装）

```powershell
choco install nodejs
```

### 使用 Winget（Windows 10/11 自带）

```powershell
winget install OpenJS.NodeJS.LTS
```

### 使用 Scoop（如果已安装）

```powershell
scoop install nodejs
```

## 方法三：使用 nvm-windows（推荐用于需要多版本管理的用户）

1. **下载 nvm-windows**
   - 访问：https://github.com/coreybutler/nvm-windows/releases
   - 下载 `nvm-setup.exe`

2. **安装 nvm-windows**
   - 运行安装程序
   - 完成后重启终端

3. **使用 nvm 安装 Node.js**
   ```bash
   nvm install lts
   nvm use lts
   ```

## 安装后验证

打开新的终端窗口（CMD 或 PowerShell），运行：

```bash
node --version
npm --version
```

如果显示版本号，说明安装成功！

## 常见问题

### npm 命令不识别
- 确保重启了终端窗口
- 检查环境变量 PATH 中是否包含 Node.js 路径
- 尝试使用完整路径：`C:\Program Files\nodejs\npm.cmd --version`

### 权限问题
- 如果遇到权限错误，可以：
  1. 以管理员身份运行终端
  2. 或配置 npm 使用不同的全局目录：
     ```bash
     npm config set prefix %APPDATA%\npm
     ```

## 更新 npm

安装 Node.js 后，可以更新到最新版本的 npm：

```bash
npm install -g npm@latest
```

## 验证安装成功

安装完成后，在项目目录中运行：

```bash
npm install
```

这将安装项目的所有依赖包。
