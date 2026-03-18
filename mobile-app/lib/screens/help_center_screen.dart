import 'package:flutter/material.dart';

class HelpCenterScreen extends StatefulWidget {
  const HelpCenterScreen({super.key});

  @override
  State<HelpCenterScreen> createState() => _HelpCenterScreenState();
}

class _HelpCenterScreenState extends State<HelpCenterScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      appBar: AppBar(
        title: const Text('Trung tâm trợ giúp', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, letterSpacing: -0.3)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        scrolledUnderElevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE0EEFF)),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionTitle('FAQ (Câu hỏi thường gặp)', Icons.help_outline_rounded, const Color(0xFF6C63FF)),
            const _FaqItem(
              question: 'Làm sao đăng ký sự kiện?',
              answer: 'Bạn có thể tìm kiếm sự kiện ở màn hình chính, nhấn vào xem chi tiết sự kiện và chọn nút "Đăng ký tham dự".',
            ),
            const _FaqItem(
              question: 'Quét QR như thế nào?',
              answer: 'Sau khi đăng nhập ứng với tư cách Sinh viên và đăng ký sự kiện thành công, mã QR sẽ hiển thị trong chi tiết sự kiện của bạn. Đưa mã này cho BTC quét khi đến tham dự.',
            ),
            const _FaqItem(
              question: 'Tại sao không check-in được?',
              answer: 'Mã QR có thể đã bị làm giả, hết hạn, hoặc sự kiện chưa bắt đầu/đã kết thúc. Bạn cũng sẽ không thể check-in nếu nằm ngoài định dạng của hệ thống.',
            ),
            const SizedBox(height: 24),

            _SectionTitle('Hướng dẫn sử dụng', Icons.menu_book_rounded, const Color(0xFF0284C7)),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Column(
                children: [
                  _GuideStep(step: 1, title: 'Đăng ký', desc: 'Tìm và đăng ký sự kiện trên hệ thống.'),
                  Divider(height: 1, indent: 60),
                  _GuideStep(step: 2, title: 'Nhận QR', desc: 'Mở ứng dụng hoặc trang chi tiết để lấy mã định danh.'),
                  Divider(height: 1, indent: 60),
                  _GuideStep(step: 3, title: 'Check-in', desc: 'Đưa mã QR cho Ban tổ chức quét để hoàn tất thủ tục.'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            _SectionTitle('Liên hệ & Báo lỗi (Report bug)', Icons.support_agent_rounded, const Color(0xFFEA580C)),
            const _ContactForm(),
            const SizedBox(height: 24),

            _SectionTitle('Thông tin ứng dụng', Icons.info_outline_rounded, const Color(0xFF16A34A)),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Column(
                children: [
                  ListTile(
                    title: Text('Phiên bản phần mềm', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    trailing: Text('v1.0.0 (Build 5)', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
                  ),
                  Divider(height: 1, color: Color(0xFFF1F5F9)),
                  ListTile(
                    title: Text('Tên Đồ án', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text('Hệ thống Quản lý và Điểm danh Sự kiện bằng QR Code', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                  ),
                  Divider(height: 1, color: Color(0xFFF1F5F9)),
                  ListTile(
                    title: Text('Sinh viên thực hiện', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text('Nguyễn Hữu Toàn - UTC2', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }
}

// ─── HELPER WIDGETS ────────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title, this.icon, this.color);
  final String title;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, size: 18, color: color),
          ),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
        ],
      ),
    );
  }
}

class _FaqItem extends StatelessWidget {
  const _FaqItem({required this.question, required this.answer});
  final String question;
  final String answer;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          iconColor: const Color(0xFF6C63FF),
          collapsedIconColor: const Color(0xFF94A3B8),
          title: Text(question, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5, color: Color(0xFF1E293B))),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          children: [
            Container(alignment: Alignment.centerLeft, child: Text(answer, style: const TextStyle(color: Color(0xFF64748B), height: 1.5, fontSize: 13))),
          ],
        ),
      ),
    );
  }
}

class _GuideStep extends StatelessWidget {
  const _GuideStep({required this.step, required this.title, required this.desc});
  final int step;
  final String title;
  final String desc;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        radius: 14,
        backgroundColor: const Color(0xFFE0EEFF),
        child: Text('$step', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0284C7))),
      ),
      title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
      subtitle: Text(desc, style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B))),
    );
  }
}

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────

class _ContactForm extends StatefulWidget {
  const _ContactForm();

  @override
  State<_ContactForm> createState() => _ContactFormState();
}

class _ContactFormState extends State<_ContactForm> {
  String _type = 'Hỗ trợ chung';
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _isLoading = false;

  Future<void> _submit() async {
    if (_titleCtrl.text.trim().isEmpty || _descCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng điền đủ Tiêu đề và Nội dung!'), backgroundColor: Colors.red));
      return;
    }
    setState(() => _isLoading = true);
    // Fake delay simulating an API call
    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() => _isLoading = false);
    _titleCtrl.clear();
    _descCtrl.clear();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Đã gửi yêu cầu thành công, chúng tôi sẽ sớm phản hồi!'),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const border = OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)), borderSide: BorderSide(color: Color(0xFFE2E8F0)));
    const focusBorder = OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12)), borderSide: BorderSide(color: Color(0xFFEA580C), width: 1.5));

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DropdownButtonFormField<String>(
            value: _type,
            decoration: const InputDecoration(
              labelText: 'Phân loại',
              labelStyle: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              border: border, enabledBorder: border, focusedBorder: focusBorder,
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            items: ['Hỗ trợ chung', 'Báo lỗi hệ thống (Bug)'].map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 14)))).toList(),
            onChanged: (v) => setState(() => _type = v!),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _titleCtrl,
            decoration: const InputDecoration(
              labelText: 'Tiêu đề',
              labelStyle: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              hintText: 'Nhập tiêu đề...',
              hintStyle: TextStyle(fontSize: 13, color: Color(0xFFCBD5E1)),
              border: border, enabledBorder: border, focusedBorder: focusBorder,
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _descCtrl,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Nội dung chi tiết',
              labelStyle: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              hintText: 'Trình bày rõ vấn đề hoặc lỗi bạn gặp phải...',
              hintStyle: TextStyle(fontSize: 13, color: Color(0xFFCBD5E1)),
              border: border, enabledBorder: border, focusedBorder: focusBorder,
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _isLoading ? null : _submit,
            icon: _isLoading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.send_rounded, size: 18),
            label: Text(_isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEA580C),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
          ),
        ],
      ),
    );
  }
}
