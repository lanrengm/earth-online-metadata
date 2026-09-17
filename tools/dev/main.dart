import 'dart:io';

/// server 仓库发布：dev → main 合并 + github 完整同步 + gitee 展示分支
///
/// 语义：server 的 main 即 GitHub Pages 线上，只有此命令显式上线时才推进；
/// 汇率 Actions 直写 main，人工改动在 dev，本命令保证 dev 始终包含 main 最新（防分叉）。
///
/// 分工：github 为完整仓库（web 源码 + 汇率 + 完整 README），gitee 仅存展示分支
/// （README + assets，供 apk 发布页展示），gitee 不再接收完整代码。
///
/// 流程：
///   1. fetch github + main 快进到最新（汇率提交）
///   2. dev 合并最新 main（汇率并入 dev，防分叉）
///   3. 推 github dev
///   4. main 快进到 dev（上线，触发 Pages 更新）
///   5. 推 github main（完整仓库）
///   6. gitee 展示分支：从 main 同步 README + assets → 提交 → push gitee main
///   7. 回到 dev
///
/// 用法：tools\dev release [--dry-run|-n]
/// 零依赖单文件，直接 dart 执行（tools\dev 垫片），不打包 exe。
void main(List<String> args) {
  var dryRun = false;
  var hasCommand = false;
  for (final a in args) {
    if (a == '--dry-run' || a == '-n') {
      dryRun = true;
    } else if (a == 'release') {
      hasCommand = true;
    } else {
      _usage('未知参数: $a');
    }
  }
  if (!hasCommand) _usage('缺少命令 release');
  if (dryRun) print('  dry-run: 只打印不执行');

  final repoDir = _resolveRepoRoot();
  _runRelease(dryRun, repoDir);
}

void _runRelease(bool dryRun, String repoDir) {
  if (!dryRun) _ensureClean(repoDir);

  void git(List<String> gitArgs, String label) {
    if (dryRun) {
      print('🔍 [DRY-RUN] git ${gitArgs.join(' ')}');
      return;
    }
    print('  -> git ${gitArgs.join(' ')}');
    final r = Process.runSync('git', gitArgs, workingDirectory: repoDir);
    if (r.exitCode != 0) {
      throw Exception('[$label] 失败: ${r.stderr}');
    }
    final out = r.stdout.toString().trim();
    if (out.isNotEmpty) print('  $out');
  }

  final pushFailures = <String>[];
  void tryPush(String label, String remote, String branch) {
    try {
      git(['push', remote, branch], '推送 $branch → $remote');
    } catch (e) {
      pushFailures.add('$label: $e');
      print('⚠️ [推送失败] $label — $e');
    }
  }

  print('-' * 60);
  print('🚀 server 仓库发布（dev→main + github 完整 / gitee 展示分支）...');

  try {
    // 1. main 更新到 github 最新（汇率 Actions 提交）
    git(['fetch', 'github'], 'fetch github');
    git(['checkout', 'main'], '切到 main');
    git(['merge', '--ff-only', 'github/main'], 'main 快进到 github 最新');

    // 2. dev 合并最新 main（汇率并入 dev，防分叉）
    git(['checkout', 'dev'], '切到 dev');
    git(['merge', '--no-edit', 'github/main'], '将 main 汇率并入 dev');

    // 3. 推 github dev（gitee 不再接收完整代码）
    tryPush('github/dev', 'github', 'dev');

    // 4. main 快进到 dev（上线，触发 Pages 更新）
    git(['checkout', 'main'], '切到 main');
    git(['merge', '--ff-only', 'dev'], 'main 快进到 dev（上线）');

    // 5. 推 github main（完整仓库：web 源码 + 汇率）
    tryPush('github/main', 'github', 'main');

    // 6. gitee 展示分支：同步 README + assets 并 push gitee main
    _syncGiteeBranch(repoDir, git, pushFailures);

    // 7. 回到 dev
    git(['checkout', 'dev'], '回到 dev');

    if (pushFailures.isEmpty) {
      print('\n🎉 server 发布完成！github 完整同步，gitee 展示分支已更新。');
    } else {
      print('\n⚠️ server 发布完成，但以下步骤失败（git 本地已完成，可手动补做）:');
      for (final f in pushFailures) {
        print('  - $f');
      }
    }
  } catch (e) {
    print('❌ server 发布失败: $e');
    // 确保回到 dev，避免停在 main
    try {
      git(['checkout', 'dev'], '回到 dev');
    } catch (_) {}
    rethrow;
  }
}

/// gitee 展示分支同步：从 main 复制最新 README + assets 到本地 gitee 分支，
/// 有变化则提交，并 push 到 gitee main（gitee 仅存展示内容，无完整代码）
void _syncGiteeBranch(
  String repoDir,
  void Function(List<String>, String) git,
  List<String> pushFailures,
) {
  try {
    git(['checkout', 'gitee'], '切到 gitee 展示分支');
    git([
      'checkout',
      'main',
      '--',
      'README.md',
      'assets',
      '.gitignore',
    ], '同步 README + assets');
    git(['add', 'README.md', 'assets', '.gitignore'], 'add 展示文件');
    final st = Process.runSync('git', [
      'status',
      '--porcelain',
    ], workingDirectory: repoDir);
    if (st.stdout.toString().trim().isNotEmpty) {
      git(['commit', '-m', 'chore: 同步 README 与演示图 [skip ci]'], '提交展示内容变更');
    }
    // 注意：普通 push（非 --force）。gitee 的 apk release 绑定 main 历史，force push 会冲掉 release，
    // 因此展示分支在本地 gitee 分支上累积提交后普通推送（fast-forward），保持 release 锚点稳定。
    git([
      'push',
      'gitee',
      'refs/heads/gitee:refs/heads/main',
    ], '推送 gitee main（展示）');
  } catch (e) {
    pushFailures.add('gitee 展示分支同步: $e');
    print('⚠️ [gitee 展示分支同步失败] $e');
  }
}

/// 仓库工作区有未提交改动时中止，防止上线时意外带入未稳定内容
void _ensureClean(String repoDir) {
  final r = Process.runSync('git', [
    'status',
    '--porcelain',
  ], workingDirectory: repoDir);
  if (r.exitCode != 0) throw Exception('无法检查仓库工作区状态: ${r.stderr}');
  final out = r.stdout.toString().trim();
  if (out.isNotEmpty) {
    throw Exception('工作区有未提交改动，请先提交或清理后再发布:\n$out');
  }
}

/// 脚本位于 <仓库根>/tools/dev/main.dart，向上取两级即仓库根；兜底用当前目录
String _resolveRepoRoot() {
  final scriptPath = Platform.script.toFilePath();
  if (scriptPath.isNotEmpty) {
    final devDir = File(scriptPath).parent.path;
    final toolsDir = File(devDir).parent.path;
    final root = File(toolsDir).parent.path;
    if (Directory('$root\\.git').existsSync() ||
        File('$root\\.git').existsSync()) {
      return root;
    }
  }
  return Directory.current.path;
}

Never _usage(String msg) {
  stdout.writeln('❌ $msg');
  stdout.writeln('用法: tools\\dev release [--dry-run|-n]');
  stdout.writeln('  release  server 仓库发布：dev→main 合并 + github 完整同步 + gitee 展示分支同步');
  exit(1);
}
