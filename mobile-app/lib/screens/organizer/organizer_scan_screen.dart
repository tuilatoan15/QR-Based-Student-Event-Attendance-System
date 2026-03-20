import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../services/organizer_service.dart';

class _ScanResult {
  final String message;
  final bool ok;
  final DateTime at;
  _ScanResult({required this.message, required this.ok}) : at = DateTime.now();
}

class OrganizerScanScreen extends StatefulWidget {
  final bool isActive;
  const OrganizerScanScreen({super.key, this.isActive = true});

  @override
  State<OrganizerScanScreen> createState() => _OrganizerScanScreenState();
}

class _OrganizerScanScreenState extends State<OrganizerScanScreen> {
  late final MobileScannerController _controller;
  bool _isProcessing = false;
  final List<_ScanResult> _history = [];

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController(autoStart: widget.isActive);
  }

  @override
  void didUpdateWidget(OrganizerScanScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive != oldWidget.isActive) {
      if (widget.isActive) {
        _controller.start();
      } else {
        _controller.stop();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;
    final code = capture.barcodes.firstOrNull?.rawValue;
    if (code == null || code.isEmpty) return;

    setState(() => _isProcessing = true);

    final result = await context.read<OrganizerService>().scanQr(code);

    if (mounted) {
      final ok = result?['success'] == true;
      final data = result?['data'] as Map<String, dynamic>?;
      final alreadyDone = data?['already_checked_in'] == true;
      final studentName = data?['student_name'] as String? ?? '';
      final checkinTime = data?['check_in_time'] as String?;

      String msg = result?['message'] as String? ?? (ok ? 'Check-in thành công!' : 'Check-in thất bại');
      if (studentName.isNotEmpty) msg = '$studentName – $msg';
      if (checkinTime != null && alreadyDone) {
        final t = DateTime.tryParse(checkinTime.endsWith('Z') ? checkinTime : '${checkinTime}Z')?.toLocal();
        if (t != null) {
          final h = t.hour.toString().padLeft(2, '0');
          final m = t.minute.toString().padLeft(2, '0');
          msg += ' ($h:$m)';
        }
      }

      setState(() {
        _isProcessing = false;
        _history.insert(0, _ScanResult(message: msg, ok: ok));
        if (_history.length > 8) _history.removeLast();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      appBar: AppBar(
        title: const Text('Scan QR Check-in', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, letterSpacing: -0.3)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        scrolledUnderElevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE0EEFF)),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.flash_on_rounded), onPressed: _controller.toggleTorch, tooltip: 'Đèn flash'),
          IconButton(icon: const Icon(Icons.flip_camera_ios_rounded), onPressed: _controller.switchCamera, tooltip: 'Đổi camera'),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // ─── Camera View ──────────────────────────────────────────────────
          Container(
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE0EEFF), width: 2),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 16, offset: const Offset(0, 4))],
            ),
            clipBehavior: Clip.antiAlias,
            height: 260,
            child: Stack(
              children: [
                // Camera
                MobileScanner(controller: _controller, onDetect: _onDetect),
                // Corner overlay
                CustomPaint(
                  painter: _ScannerOverlayPainter(),
                  child: const SizedBox.expand(),
                ),
                // Processing overlay
                if (_isProcessing)
                  Container(
                    color: Colors.black54,
                    child: const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                          SizedBox(height: 10),
                          Text('Đang xử lý...', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ),
                // Hint
                Positioned(
                  bottom: 14,
                  left: 0,
                  right: 0,
                  child: Text(
                    'Đưa mã QR vào khung để check-in',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12.5, shadows: [const Shadow(blurRadius: 6, color: Colors.black54)]),
                  ),
                ),
              ],
            ),
          ),

          // ─── Recent Scan Results ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Row(
              children: [
                const Text('Kết quả quét gần đây', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                const SizedBox(width: 8),
                if (_history.isNotEmpty)
                  GestureDetector(
                    onTap: () => setState(() => _history.clear()),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(6)),
                      child: const Text('Xóa', style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                    ),
                  ),
              ],
            ),
          ),

          Expanded(
            child: _history.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.qr_code_scanner_rounded, size: 48, color: Colors.grey.shade300),
                        const SizedBox(height: 10),
                        const Text('Chưa có kết quả quét nào', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13.5)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    itemCount: _history.length,
                    itemBuilder: (_, i) {
                      final r = _history[i];
                      final timeStr = '${r.at.hour.toString().padLeft(2, '0')}:${r.at.minute.toString().padLeft(2, '0')}:${r.at.second.toString().padLeft(2, '0')}';
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(13),
                        decoration: BoxDecoration(
                          color: r.ok ? const Color(0xFFF0FDF4) : const Color(0xFFFFF1F2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: r.ok ? const Color(0xFFBBF7D0) : const Color(0xFFFECACA)),
                        ),
                        child: Row(
                          children: [
                            Icon(r.ok ? Icons.check_circle_rounded : Icons.cancel_rounded, color: r.ok ? const Color(0xFF16A34A) : const Color(0xFFBE123C), size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(r.message, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: r.ok ? const Color(0xFF15803D) : const Color(0xFFBE123C)), maxLines: 2, overflow: TextOverflow.ellipsis),
                                  const SizedBox(height: 2),
                                  Text(timeStr, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

// ─── Scanner Overlay Corner Painter ───────────────────────────────────────────

class _ScannerOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const cornerLen = 28.0;
    const strokeW = 4.0;
    const padding = 50.0;
    const radius = 10.0;
    const color = Color(0xFF6C63FF);

    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeW
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final l = padding;
    final t = padding * 0.6;
    final r = size.width - padding;
    final b = size.height - padding * 0.6;

    // Top-left
    canvas.drawPath(Path()..moveTo(l, t + cornerLen)..lineTo(l, t + radius)..arcToPoint(Offset(l + radius, t), radius: const Radius.circular(radius))..lineTo(l + cornerLen, t), paint);
    // Top-right
    canvas.drawPath(Path()..moveTo(r - cornerLen, t)..lineTo(r - radius, t)..arcToPoint(Offset(r, t + radius), radius: const Radius.circular(radius))..lineTo(r, t + cornerLen), paint);
    // Bottom-left
    canvas.drawPath(Path()..moveTo(l, b - cornerLen)..lineTo(l, b - radius)..arcToPoint(Offset(l + radius, b), radius: const Radius.circular(radius), clockwise: false)..lineTo(l + cornerLen, b), paint);
    // Bottom-right
    canvas.drawPath(Path()..moveTo(r - cornerLen, b)..lineTo(r - radius, b)..arcToPoint(Offset(r, b - radius), radius: const Radius.circular(radius), clockwise: false)..lineTo(r, b - cornerLen), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
