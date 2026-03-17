import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/organizer_service.dart';
import '../../models/event.dart';

class OrganizerEventFormScreen extends StatefulWidget {
  const OrganizerEventFormScreen({super.key, this.event});
  final Event? event; // null = tạo mới, non-null = sửa

  @override
  State<OrganizerEventFormScreen> createState() => _OrganizerEventFormScreenState();
}

class _OrganizerEventFormScreenState extends State<OrganizerEventFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleCtrl;
  late TextEditingController _descCtrl;
  late TextEditingController _locationCtrl;
  late TextEditingController _maxCtrl;
  DateTime? _startTime;
  DateTime? _endTime;

  bool get _isEditing => widget.event != null;

  @override
  void initState() {
    super.initState();
    final e = widget.event;
    _titleCtrl = TextEditingController(text: e?.title ?? '');
    _descCtrl = TextEditingController(text: e?.description ?? '');
    _locationCtrl = TextEditingController(text: e?.location ?? '');
    _maxCtrl = TextEditingController(text: e?.maxParticipants.toString() ?? '50');
    _startTime = e?.startTime;
    _endTime = e?.endTime;
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _locationCtrl.dispose();
    _maxCtrl.dispose();
    super.dispose();
  }

  Future<void> _selectDateTime(bool isStart) async {
    final now = DateTime.now();
    final initial = isStart ? (_startTime ?? now) : (_endTime ?? now.add(const Duration(hours: 2)));
    final date = await showDatePicker(context: context, initialDate: initial, firstDate: now.subtract(const Duration(days: 365)), lastDate: now.add(const Duration(days: 365 * 5)));
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(initial));
    if (time == null || !mounted) return;
    final result = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    setState(() {
      if (isStart) _startTime = result;
      else _endTime = result;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_startTime == null || _endTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng chọn thời gian bắt đầu và kết thúc'), backgroundColor: Colors.red));
      return;
    }
    if (_endTime!.isBefore(_startTime!)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Thời gian kết thúc phải sau thời gian bắt đầu'), backgroundColor: Colors.red));
      return;
    }

    final body = {
      'title': _titleCtrl.text.trim(),
      'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
      'location': _locationCtrl.text.trim(),
      'start_time': _startTime!.toIso8601String(),
      'end_time': _endTime!.toIso8601String(),
      'max_participants': int.tryParse(_maxCtrl.text) ?? 50,
    };

    final service = context.read<OrganizerService>();
    bool success;
    if (_isEditing) {
      success = await service.updateEvent(widget.event!.id, body);
    } else {
      success = await service.createEvent(body);
    }

    if (mounted) {
      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEditing ? 'Đã cập nhật sự kiện' : 'Đã tạo sự kiện thành công'),
          backgroundColor: Colors.green,
        ));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(service.errorMessage ?? 'Có lỗi xảy ra'),
          backgroundColor: Colors.red,
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = context.watch<OrganizerService>();
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
    const accent = Color(0xFF6C63FF);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5FF),
      appBar: AppBar(
        title: Text(_isEditing ? 'Sửa sự kiện' : 'Tạo sự kiện mới'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1A1A2E),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Field(controller: _titleCtrl, label: 'Tên sự kiện *', hint: 'Ví dụ: Workshop Flutter 2026', icon: Icons.event_rounded,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập tên sự kiện' : null),
              const SizedBox(height: 16),
              _Field(controller: _descCtrl, label: 'Mô tả', hint: 'Nội dung, chủ đề, thông tin cần biết...', icon: Icons.description_outlined, maxLines: 3),
              const SizedBox(height: 16),
              _Field(controller: _locationCtrl, label: 'Địa điểm *', hint: 'Phòng lab, hội trường...', icon: Icons.location_on_outlined,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập địa điểm' : null),
              const SizedBox(height: 16),
              _Field(controller: _maxCtrl, label: 'Số người tối đa *', hint: '50', icon: Icons.people_rounded, keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                validator: (v) {
                  final n = int.tryParse(v ?? '');
                  return (n == null || n <= 0) ? 'Nhập số hợp lệ' : null;
                }),
              const SizedBox(height: 20),
              _DateTimePicker(
                label: 'Thời gian bắt đầu *',
                value: _startTime != null ? dateFormat.format(_startTime!) : null,
                onTap: () => _selectDateTime(true),
              ),
              const SizedBox(height: 12),
              _DateTimePicker(
                label: 'Thời gian kết thúc *',
                value: _endTime != null ? dateFormat.format(_endTime!) : null,
                onTap: () => _selectDateTime(false),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: service.isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(backgroundColor: accent, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                  child: service.isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(_isEditing ? 'Cập nhật sự kiện' : 'Tạo sự kiện', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.controller, required this.label, required this.hint, required this.icon, this.validator, this.maxLines = 1, this.keyboardType, this.inputFormatters});
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final String? Function(String?)? validator;
  final int maxLines;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, color: const Color(0xFF6C63FF)),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6C63FF), width: 2)),
      ),
    );
  }
}

class _DateTimePicker extends StatelessWidget {
  const _DateTimePicker({required this.label, required this.value, required this.onTap});
  final String label;
  final String? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: value != null ? const Color(0xFF6C63FF) : const Color(0xFFE0E0E0)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today_rounded, color: Color(0xFF6C63FF), size: 20),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF9E9E9E))),
                const SizedBox(height: 2),
                Text(value ?? 'Chọn ngày & giờ', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: value != null ? const Color(0xFF1A1A2E) : const Color(0xFFBDBDBD))),
              ],
            ),
            const Spacer(),
            const Icon(Icons.arrow_drop_down_rounded, color: Color(0xFF6C63FF)),
          ],
        ),
      ),
    );
  }
}
