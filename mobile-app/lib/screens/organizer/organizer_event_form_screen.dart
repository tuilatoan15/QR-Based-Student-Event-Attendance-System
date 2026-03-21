import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:html_editor_enhanced/html_editor.dart';
import 'package:http/http.dart' as http;
import 'dart:io';

import '../../config/api_config.dart';
import '../../services/organizer_service.dart';
import '../../models/event.dart';

class OrganizerEventFormScreen extends StatefulWidget {
  const OrganizerEventFormScreen({super.key, this.event});
  final Event? event;

  @override
  State<OrganizerEventFormScreen> createState() => _OrganizerEventFormScreenState();
}

class _OrganizerEventFormScreenState extends State<OrganizerEventFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleCtrl;
  late TextEditingController _locationCtrl;
  late TextEditingController _maxCtrl;
  DateTime? _startTime;
  DateTime? _endTime;

  final HtmlEditorController _htmlCtrl = HtmlEditorController();
  
  final ImagePicker _picker = ImagePicker();
  List<File> _selectedFiles = [];
  List<String> _existingImages = [];

  bool get _isEditing => widget.event != null;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final e = widget.event;
    _titleCtrl = TextEditingController(text: e?.title ?? '');
    _locationCtrl = TextEditingController(text: e?.location ?? '');
    _maxCtrl = TextEditingController(text: e?.maxParticipants.toString() ?? '50');
    _startTime = e?.startTime;
    _endTime = e?.endTime;
    
    if (e != null && e.images.isNotEmpty) {
      _existingImages = List.from(e.images);
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _locationCtrl.dispose();
    _maxCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picked = await _picker.pickMultiImage();
    if (picked.isNotEmpty) {
      if (_selectedFiles.length + _existingImages.length + picked.length > 10) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tối đa 10 hình ảnh')));
        }
        return;
      }
      setState(() {
        _selectedFiles.addAll(picked.map((x) => File(x.path)));
      });
    }
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
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng chọn thời gian'), backgroundColor: Colors.red));
      return;
    }
    if (_endTime!.isBefore(_startTime!)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Kết thúc phải sau bắt đầu'), backgroundColor: Colors.red));
      return;
    }

    setState(() => _submitting = true);

    String htmlDesc = await _htmlCtrl.getText();

    final fields = <String, String>{
      'title': _titleCtrl.text.trim(),
      'description': htmlDesc,
      'location': _locationCtrl.text.trim(),
      'start_time': _startTime!.toIso8601String(),
      'end_time': _endTime!.toIso8601String(),
      'max_participants': (int.tryParse(_maxCtrl.text) ?? 50).toString(),
    };

    final filePaths = _selectedFiles.map((e) => e.path).toList();

    final service = context.read<OrganizerService>();
    bool success;
    if (_isEditing) {
      success = await service.updateEvent(widget.event!.id, fields, filePaths, _existingImages);
    } else {
      success = await service.createEvent(fields, filePaths);
    }

    if (mounted) {
      setState(() => _submitting = false);
      if (success) {
        if (Navigator.canPop(context)) Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEditing ? 'Đã cập nhật sự kiện' : 'Đã tạo sự kiện'),
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

  Future<void> _handleCustomImageUpload(FileUpload file) async {
    // Custom logic to upload the isolated editor image inline to /editor-image endpoint
    try {
      if (file.base64 == null) return;
      final String b64 = file.base64!.split(",").last;
      final bytes = base64Decode(b64);

      final request = http.MultipartRequest('POST', Uri.parse('${ApiConfig.baseUrl}/api/upload/editor-image'));
      request.files.add(http.MultipartFile.fromBytes('image', bytes, filename: file.name ?? 'image.png'));
      final res = await request.send();
      final resData = jsonDecode(await res.stream.bytesToString());
      
      if (resData['success'] == true) {
        final url = '${ApiConfig.baseUrl}${resData["url"]}';
        _htmlCtrl.insertNetworkImage(url, filename: file.name ?? '');
      } else {
        throw Exception();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lỗi upload ảnh văn bản'), backgroundColor: Colors.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = context.watch<OrganizerService>();
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
    final isLoading = _submitting || service.isLoading;

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
              _Field(controller: _titleCtrl, label: 'Tên sự kiện *', hint: 'Ví dụ: Workshop Flutter', icon: Icons.event_rounded,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Bắt buộc nhập' : null),
              const SizedBox(height: 16),
              
              const Text('Mô tả (HTML)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF374151))),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(border: Border.all(color: const Color(0xFFE0E0E0)), borderRadius: BorderRadius.circular(12), color: Colors.white),
                child: HtmlEditor(
                  controller: _htmlCtrl,
                  htmlEditorOptions: HtmlEditorOptions(
                    hint: "Nhập nội dung sự kiện...",
                    initialText: widget.event?.description ?? '',
                  ),
                  htmlToolbarOptions: const HtmlToolbarOptions(
                    toolbarPosition: ToolbarPosition.aboveEditor,
                    renderSeparatorWidget: false,
                    defaultToolbarButtons: [
                       StyleButtons(),
                       FontSettingButtons(),
                       ColorButtons(),
                       ListButtons(),
                       InsertButtons(video: false, audio: false, hr: false, table: false),
                    ]
                  ),
                  otherOptions: const OtherOptions(height: 300),
                  callbacks: Callbacks(
                    onImageUpload: (FileUpload file) async {
                      await _handleCustomImageUpload(file);
                    }
                  ),
                ),
              ),
              const SizedBox(height: 16),
              
              const Text('Hình ảnh Gallery', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF374151))),
              const SizedBox(height: 8),
              InkWell(
                onTap: _pickImages,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(border: Border.all(color: const Color(0xFFE0E0E0), style: BorderStyle.solid), borderRadius: BorderRadius.circular(12), color: Colors.white),
                  child: const Center(child: Text('+ Thêm ảnh dự phòng (Tối đa 10 ảnh)', style: TextStyle(color: Colors.blueAccent))),
                ),
              ),
              if (_existingImages.isNotEmpty || _selectedFiles.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10, runSpacing: 10,
                  children: [
                    ..._existingImages.asMap().entries.map((e) => _buildPreviewUrl(e.value, e.key)),
                    ..._selectedFiles.asMap().entries.map((e) => _buildPreviewFile(e.value, e.key)),
                  ],
                ),
              ],
              
              const SizedBox(height: 16),
              _Field(controller: _locationCtrl, label: 'Địa điểm *', hint: 'Phòng lab...', icon: Icons.location_on_outlined,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Bắt buộc nhập' : null),
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
                  onPressed: isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C63FF), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                  child: isLoading
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

  Widget _buildPreviewUrl(String url, int index) {
    return Stack(
      children: [
        Container(width: 70, height: 70, decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey.shade300)),
          child: ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.network('${ApiConfig.baseUrl}$url', fit: BoxFit.cover)),
        ),
        Positioned(top: 2, right: 2, child: InkWell(
          onTap: () => setState(() => _existingImages.removeAt(index)),
          child: Container(decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle), padding: const EdgeInsets.all(4), child: const Icon(Icons.close, size: 12, color: Colors.white)),
        )),
      ],
    );
  }

  Widget _buildPreviewFile(File file, int index) {
    return Stack(
      children: [
        Container(width: 70, height: 70, decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey.shade300)),
          child: ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.file(file, fit: BoxFit.cover)),
        ),
        Positioned(top: 2, right: 2, child: InkWell(
          onTap: () => setState(() => _selectedFiles.removeAt(index)),
          child: Container(decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle), padding: const EdgeInsets.all(4), child: const Icon(Icons.close, size: 12, color: Colors.white)),
        )),
      ],
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
