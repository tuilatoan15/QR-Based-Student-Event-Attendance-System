import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/theme_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notifyNewEvent = true;
  bool _notifyCheckIn = true;

  void _showChangePasswordDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _ChangePasswordSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final isDark = themeProvider.isDarkMode;
    final accent = Theme.of(context).colorScheme.primary;
    final surfaceColor = Theme.of(context).cardTheme.color ?? Colors.white;
    final textColor = Theme.of(context).textTheme.bodyLarge?.color ?? const Color(0xFF0F172A);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cài đặt tài khoản'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1, 
            color: isDark ? const Color(0xFF334155) : const Color(0xFFE0EEFF),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        children: [
          // ─── TÀI KHOẢN ───
          _SectionTitle('Tài khoản', Icons.person_outline_rounded, accent),
          Container(
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? const Color(0xFF475569) : const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: accent.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                    child: Icon(Icons.lock_outline_rounded, color: accent, size: 20),
                  ),
                  title: Text('Đổi mật khẩu', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5, color: textColor)),
                  trailing: Icon(Icons.chevron_right_rounded, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFFCBD5E1)),
                  onTap: _showChangePasswordDialog,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ─── THÔNG BÁO ───
          _SectionTitle('Cài đặt thông báo', Icons.notifications_none_rounded, const Color(0xFFEA580C)),
          Container(
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? const Color(0xFF475569) : const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  value: _notifyNewEvent,
                  onChanged: (v) => setState(() => _notifyNewEvent = v),
                  activeColor: const Color(0xFFEA580C),
                  title: Text('Thông báo sự kiện mới', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5, color: textColor)),
                  subtitle: Text('Nhận thông báo khi có sự kiện sắp mở đăng ký', style: TextStyle(fontSize: 12.5, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B))),
                  secondary: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: const Color(0xFFEA580C).withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.campaign_outlined, color: Color(0xFFEA580C), size: 20),
                  ),
                ),
                Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Divider(height: 1, color: isDark ? const Color(0xFF475569) : const Color(0xFFE2E8F0))),
                SwitchListTile(
                  value: _notifyCheckIn,
                  onChanged: (v) => setState(() => _notifyCheckIn = v),
                  activeColor: const Color(0xFFEA580C),
                  title: Text('Thông báo check-in', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5, color: textColor)),
                  subtitle: Text('Xác nhận khi bạn quét mã check-in thành công', style: TextStyle(fontSize: 12.5, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B))),
                  secondary: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: const Color(0xFFEA580C).withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.how_to_reg_rounded, color: Color(0xFFEA580C), size: 20),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ─── GIAO DIỆN ───
          _SectionTitle('Giao diện', Icons.palette_outlined, const Color(0xFF16A34A)),
          Container(
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? const Color(0xFF475569) : const Color(0xFFE2E8F0)),
            ),
            child: SwitchListTile(
              value: isDark,
              onChanged: (v) => themeProvider.toggleTheme(v),
              activeColor: const Color(0xFF16A34A),
              title: Text('Chế độ màn hình tối (Dark Mode)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5, color: textColor)),
              secondary: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFF16A34A).withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                child: Icon(isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded, color: const Color(0xFF16A34A), size: 20),
              ),
            ),
          ),
          const SizedBox(height: 48),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title, this.icon, this.color);
  final String title;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final textColor = Theme.of(context).textTheme.bodyLarge?.color ?? const Color(0xFF0F172A);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 8),
          Text(title, style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: textColor)),
        ],
      ),
    );
  }
}

class _ChangePasswordSheet extends StatefulWidget {
  const _ChangePasswordSheet();

  @override
  State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<_ChangePasswordSheet> {
  final _oldPassCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  bool _isLoading = false;
  String? _errorMsg;

  Future<void> _submit() async {
    final oldPass = _oldPassCtrl.text;
    final newPass = _newPassCtrl.text;
    final confirmPass = _confirmPassCtrl.text;

    if (oldPass.isEmpty || newPass.isEmpty || confirmPass.isEmpty) {
      setState(() => _errorMsg = 'Vui lòng điền đầy đủ các trường');
      return;
    }
    if (newPass.length < 6) {
      setState(() => _errorMsg = 'Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }
    if (newPass != confirmPass) {
      setState(() => _errorMsg = 'Mật khẩu xác nhận không khớp');
      return;
    }

    setState(() { _isLoading = true; _errorMsg = null; });
    // Fake API call
    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (Navigator.canPop(context)) Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đổi mật khẩu thành công!'), backgroundColor: Colors.green),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeProvider>().isDarkMode;
    final bg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);

    return Container(
      padding: EdgeInsets.only(
        top: 24, left: 24, right: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Đổi mật khẩu', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: textColor)),
              IconButton(icon: const Icon(Icons.close_rounded), onPressed: () { if (Navigator.canPop(context)) Navigator.pop(context); }),
            ],
          ),
          const SizedBox(height: 16),
          if (_errorMsg != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded, color: Colors.red, size: 16),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_errorMsg!, style: const TextStyle(color: Colors.red, fontSize: 13))),
                ],
              ),
            ),
          TextFormField(
            controller: _oldPassCtrl,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Mật khẩu cũ'),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _newPassCtrl,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Mật khẩu mới (từ 6 ký tự)'),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _confirmPassCtrl,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Xác nhận lại mật khẩu mới'),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _isLoading ? null : _submit,
            child: _isLoading 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Lưu thay đổi'),
          ),
        ],
      ),
    );
  }
}
