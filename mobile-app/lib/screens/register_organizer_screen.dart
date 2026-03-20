import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../widgets/primary_button.dart';
import 'login_screen.dart';

class RegisterOrganizerScreen extends StatefulWidget {
  const RegisterOrganizerScreen({super.key});
  static const String routeName = '/register-organizer';

  @override
  State<RegisterOrganizerScreen> createState() => _RegisterOrganizerScreenState();
}

class _RegisterOrganizerScreenState extends State<RegisterOrganizerScreen> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _fullNameCtrl    = TextEditingController();
  final _emailCtrl       = TextEditingController();
  final _passwordCtrl    = TextEditingController();
  final _confirmCtrl     = TextEditingController();
  final _orgNameCtrl     = TextEditingController();
  final _positionCtrl    = TextEditingController();
  final _phoneCtrl       = TextEditingController();
  final _bioCtrl         = TextEditingController();

  // State
  int    _step            = 0; // 0 = Tài khoản, 1 = Tổ chức
  bool   _obscurePw       = true;
  bool   _obscureConfirm  = true;
  bool   _isLoading       = false;
  String? _errorMessage;

  // Màu chủ đạo
  static const _primary = Color(0xFF2563EB);
  static const _ink     = Color(0xFF0F172A);
  static const _ink2    = Color(0xFF475569);
  static const _ink3    = Color(0xFF94A3B8);
  static const _surface = Color(0xFFF8FAFC);
  static const _border  = Color(0xFFE2E8F0);

  @override
  void dispose() {
    for (final c in [
      _fullNameCtrl, _emailCtrl, _passwordCtrl, _confirmCtrl,
      _orgNameCtrl, _positionCtrl, _phoneCtrl, _bioCtrl,
    ]) { c.dispose(); }
    super.dispose();
  }

  // ── Validate step 0 ────────────────────────────────────────────
  bool _validateStep0() {
    bool ok = true;
    if (_fullNameCtrl.text.trim().isEmpty ||
        _emailCtrl.text.trim().isEmpty    ||
        _passwordCtrl.text.isEmpty        ||
        _confirmCtrl.text.isEmpty) {
      ok = false;
    }
    if (_passwordCtrl.text != _confirmCtrl.text) ok = false;
    if (_passwordCtrl.text.length < 6) ok = false;
    return ok;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _isLoading = true; _errorMessage = null; });

    final auth   = context.read<AuthService>();
    final result = await auth.registerOrganizer(
      fullName: _fullNameCtrl.text.trim(),
      email:    _emailCtrl.text.trim(),
      password: _passwordCtrl.text,
      orgName:  _orgNameCtrl.text.trim(),
      position: _positionCtrl.text.trim(),
      phone:    _phoneCtrl.text.trim(),
      bio:      _bioCtrl.text.trim(),
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result) {
      _showSuccessDialog();
    } else {
      setState(() => _errorMessage = auth.errorMessage ?? 'Đăng ký thất bại');
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64, height: 64,
                decoration: const BoxDecoration(
                  color: Color(0xFFF0FDF4), shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded,
                    color: Color(0xFF16A34A), size: 36),
              ),
              const SizedBox(height: 20),
              const Text('Đăng ký thành công!',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700,
                      color: _ink)),
              const SizedBox(height: 10),
              const Text(
                'Tài khoản của bạn đang chờ Admin xét duyệt.\n'
                'Thường mất 1–2 ngày làm việc.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: _ink2, height: 1.6),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    elevation: 0,
                  ),
                  onPressed: () {
                    Navigator.of(context).pop();
                    Navigator.of(context)
                        .pushReplacementNamed(LoginScreen.routeName);
                  },
                  child: const Text('Về trang đăng nhập',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Helpers UI ──────────────────────────────────────────────────
  InputDecoration _inputDec(String label, IconData icon, {bool required = false}) {
    return InputDecoration(
      labelText: required ? '$label *' : label,
      labelStyle: const TextStyle(fontSize: 13.5, color: _ink2),
      prefixIcon: Icon(icon, size: 19, color: _ink3),
      filled: true,
      fillColor: _surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: _border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: _border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: _primary, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFEF4444)),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
      ),
    );
  }

  // ── Step Indicator ──────────────────────────────────────────────
  Widget _buildStepper() {
    final steps = ['Tài khoản', 'Tổ chức', 'Xét duyệt'];
    return Row(
      children: List.generate(steps.length * 2 - 1, (i) {
        if (i.isOdd) {
          // connector line
          final doneIdx = i ~/ 2;
          return Expanded(
            child: Container(
              height: 1.5,
              color: doneIdx < _step ? _primary : _border,
            ),
          );
        }
        final idx = i ~/ 2;
        final isDone   = idx < _step;
        final isActive = idx == _step;
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 28, height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDone  ? const Color(0xFF16A34A)
                     : isActive ? _primary
                     : _border,
              ),
              alignment: Alignment.center,
              child: isDone
                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                  : Text('${idx + 1}',
                      style: TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w700,
                        color: isActive ? Colors.white : _ink3,
                      )),
            ),
            const SizedBox(height: 5),
            Text(steps[idx],
              style: TextStyle(
                fontSize: 11,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                color: isActive ? _ink : _ink3,
              )),
          ],
        );
      }),
    );
  }

  // ── Step 0: Account info ────────────────────────────────────────
  Widget _buildStep0() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionLabel('Thông tin đăng nhập'),
        const SizedBox(height: 12),
        TextFormField(
          controller: _fullNameCtrl,
          textInputAction: TextInputAction.next,
          decoration: _inputDec('Họ và tên', Icons.person_outline_rounded, required: true),
          validator: (v) => v!.trim().isEmpty ? 'Vui lòng nhập họ tên' : null,
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          decoration: _inputDec('Email', Icons.email_outlined, required: true),
          validator: (v) {
            if (v!.trim().isEmpty) return 'Vui lòng nhập email';
            if (!v.contains('@')) return 'Email không hợp lệ';
            return null;
          },
        ),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _passwordField()),
          const SizedBox(width: 10),
          Expanded(child: _confirmField()),
        ]),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: _primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(vertical: 14),
              elevation: 0,
            ),
            onPressed: () {
              if (_validateStep0()) {
                setState(() => _step = 1);
              } else {
                _formKey.currentState!.validate();
              }
            },
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Tiếp theo',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                SizedBox(width: 8),
                Icon(Icons.arrow_forward_rounded, size: 17),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _passwordField() => TextFormField(
    controller: _passwordCtrl,
    obscureText: _obscurePw,
    textInputAction: TextInputAction.next,
    decoration: _inputDec('Mật khẩu', Icons.lock_outline_rounded, required: true).copyWith(
      suffixIcon: _eyeBtn(_obscurePw, () => setState(() => _obscurePw = !_obscurePw)),
    ),
    validator: (v) {
      if (v!.isEmpty) return 'Nhập mật khẩu';
      if (v.length < 6) return 'Tối thiểu 6 ký tự';
      return null;
    },
  );

  Widget _confirmField() => TextFormField(
    controller: _confirmCtrl,
    obscureText: _obscureConfirm,
    textInputAction: TextInputAction.done,
    decoration: _inputDec('Xác nhận MK', Icons.lock_outline_rounded, required: true).copyWith(
      suffixIcon: _eyeBtn(_obscureConfirm, () => setState(() => _obscureConfirm = !_obscureConfirm)),
    ),
    validator: (v) => v != _passwordCtrl.text ? 'Không khớp' : null,
  );

  Widget _eyeBtn(bool obscure, VoidCallback onTap) => IconButton(
    icon: Icon(
      obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
      size: 18, color: _ink3,
    ),
    onPressed: onTap,
  );

  // ── Step 1: Org info ────────────────────────────────────────────
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionLabel('Thông tin tổ chức'),
        const SizedBox(height: 12),
        TextFormField(
          controller: _orgNameCtrl,
          textInputAction: TextInputAction.next,
          decoration: _inputDec('Tên tổ chức / CLB / Khoa',
              Icons.business_outlined, required: true),
          validator: (v) => v!.trim().isEmpty ? 'Vui lòng nhập tên tổ chức' : null,
        ),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: TextFormField(
            controller: _positionCtrl,
            textInputAction: TextInputAction.next,
            decoration: _inputDec('Chức vụ', Icons.badge_outlined),
          )),
          const SizedBox(width: 10),
          Expanded(child: TextFormField(
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.next,
            decoration: _inputDec('Số điện thoại', Icons.phone_outlined),
          )),
        ]),
        const SizedBox(height: 12),
        TextFormField(
          controller: _bioCtrl,
          maxLines: 3,
          textInputAction: TextInputAction.done,
          decoration: _inputDec('Giới thiệu ngắn', Icons.notes_rounded)
              .copyWith(alignLabelWithHint: true),
        ),
        const SizedBox(height: 24),

        // Lưu ý xét duyệt
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF7ED),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFFED7AA)),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline_rounded,
                  size: 17, color: Color(0xFFD97706)),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Sau khi gửi, Admin sẽ xét duyệt tài khoản trong 1–2 ngày làm việc.',
                  style: TextStyle(
                      fontSize: 12.5, color: Color(0xFF92400E), height: 1.5),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        Row(children: [
          // Quay lại
          Expanded(
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: _ink2,
                side: const BorderSide(color: _border),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: () => setState(() => _step = 0),
              child: const Text('Quay lại',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            ),
          ),
          const SizedBox(width: 10),
          // Gửi đăng ký
          Expanded(
            flex: 2,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                elevation: 0,
              ),
              onPressed: _isLoading ? null : _submit,
              child: _isLoading
                  ? const SizedBox(
                      width: 20, height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2.5, color: Colors.white))
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.send_rounded, size: 16),
                        SizedBox(width: 8),
                        Text('Gửi yêu cầu',
                            style: TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 14)),
                      ],
                    ),
            ),
          ),
        ]),
      ],
    );
  }

  Widget _sectionLabel(String text) => Text(
    text.toUpperCase(),
    style: const TextStyle(
      fontSize: 10.5, fontWeight: FontWeight.w700,
      letterSpacing: 0.8, color: _ink3,
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Đăng ký Organizer',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        backgroundColor: Colors.white,
        foregroundColor: _ink,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: _border),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF2563EB).withOpacity(0.06),
                blurRadius: 20,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                Row(children: [
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.group_add_outlined,
                        color: _primary, size: 22),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Tài khoản Organizer',
                          style: TextStyle(fontSize: 17,
                              fontWeight: FontWeight.w700, color: _ink)),
                      Text('Ban tổ chức · CLB · Khoa',
                          style: TextStyle(fontSize: 12.5, color: _ink3)),
                    ],
                  ),
                ]),
                const SizedBox(height: 24),

                // Error banner
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 11),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFECACA)),
                    ),
                    child: Row(children: [
                      const Icon(Icons.error_outline_rounded,
                          size: 17, color: Color(0xFFEF4444)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(_errorMessage!,
                            style: const TextStyle(
                                fontSize: 13, color: Color(0xFFBE123C))),
                      ),
                    ]),
                  ),
                  const SizedBox(height: 16),
                ],

                // Step indicator
                _buildStepper(),
                const SizedBox(height: 24),

                // Step content
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  child: _step == 0
                      ? _buildStep0()
                      : _buildStep1(),
                ),

                // Login link
                const SizedBox(height: 16),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Text('Đã có tài khoản?',
                      style: TextStyle(fontSize: 13, color: _ink3)),
                  TextButton(
                    onPressed: () => Navigator.of(context)
                        .pushReplacementNamed(LoginScreen.routeName),
                    style: TextButton.styleFrom(
                      foregroundColor: _primary,
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text('Đăng nhập',
                        style: TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 13)),
                  ),
                ]),
              ],
            ),
          ),
        ),
      ),
    );
  }
}