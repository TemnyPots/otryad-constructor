// macOS: without an Apple certificate the app bundle stays unsigned, and Apple Silicon Macs
// refuse to start it ("damaged"). Ad-hoc signing the whole bundle fixes that.
const { execFileSync } = require("child_process");
const path = require("path");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;
  // universal build: the x64/arm64 halves must stay identical to be merged, sign only the merged app
  if (/-temp$/.test(context.appOutDir)) return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", appPath], { stdio: "inherit" });
  execFileSync("codesign", ["--verify", "--deep", "--strict", appPath], { stdio: "inherit" });
};
