import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../services/organizer_service.dart';

class OrganizerScanScreen extends StatefulWidget {
  const OrganizerScanScreen({super.key});

  @override
  State<OrganizerScanScreen> createState() => _OrganizerScanScreenState();
}

class _OrganizerScanScreenState extends State<OrganizerScanScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _isProcessing = false;
  String? _lastResult;
  bool? _lastSuccess;
  String? _lastMessage;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;
    final code = capture.barcodes.firstOrNull?.rawValue;
    if (code == null || code.isEmpty) return;

    setState(() { _isProcessing = true; _lastResult = code; });

    final result = await context.read<OrganizerService>().scanQr(code);

    if (mounted) {
      setState(() {
        _isProcessing = false;
        _lastSuccess = result?['success'] == true;
        _lastMessage = result?['message'] as String? ??
            (_lastSuccess == true ? 'Check-in thành công!' : 'Check-in thất bại');
      });
    }
  }

  void _reset() => setState(() { _isProcessing = false; _lastResult = null; _lastSuccess = null; _lastMessage = null; });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Scan QR Check-in', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.transparent,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(icon: const Icon(Icons.flash_on_rounded, color: Colors.white), onPressed: _controller.toggleTorch),
          IconButton(icon: const Icon(Icons.flip_camera_ios_rounded, color: Colors.white), onPressed: _controller.switchCamera),
        ],
      ),
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // ─── Camera ────────────────────────
          MobileScanner(controller: _controller, onDetect: _onDetect),

          // ─── Scanner Frame ────────────────
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 3),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Stack(
                children: [
                  _Corner(top: true, left: true),
                  _Corner(top: true, left: false),
                  _Corner(top: false, left: true),
                  _Corner(top: false, left: false),
                ],
              ),
            ),
          ),

          // ─── Hint Text ────────────────────
          Positioned(
            bottom: 160,
            left: 0,
            right: 0,
            child: Text('Đưa mã QR vào khung để check-in', textAlign: TextAlign.center, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14)),
          ),

          // ─── Processing indicator ─────────
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [CircularProgressIndicator(color: Colors.white), SizedBox(height: 16), Text('Đang xử lý...', style: TextStyle(color: Colors.white, fontSize: 16))])),
            ),

          // ─── Result Card ──────────────────
          if (_lastSuccess != null && !_isProcessing)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: _lastSuccess! ? const Color(0xFF1B5E20) : const Color(0xFFB71C1C),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(_lastSuccess! ? Icons.check_circle_rounded : Icons.cancel_rounded, color: Colors.white, size: 52),
                    const SizedBox(height: 12),
                    Text(_lastSuccess! ? 'CHECK-IN THÀNH CÔNG' : 'CHECK-IN THẤT BẠI',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18, letterSpacing: 1)),
                    const SizedBox(height: 8),
                    Text(_lastMessage ?? '', textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70, fontSize: 14)),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _reset,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.black87, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                        child: const Text('Quét tiếp', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _Corner extends StatelessWidget {
  const _Corner({required this.top, required this.left});
  final bool top;
  final bool left;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: top ? -1 : null,
      bottom: top ? null : -1,
      left: left ? -1 : null,
      right: left ? null : -1,
      child: Container(
        width: 30, height: 30,
        decoration: BoxDecoration(
          border: Border(
            top: top ? const BorderSide(color: Color(0xFF6C63FF), width: 4) : BorderSide.none,
            bottom: top ? BorderSide.none : const BorderSide(color: Color(0xFF6C63FF), width: 4),
            left: left ? const BorderSide(color: Color(0xFF6C63FF), width: 4) : BorderSide.none,
            right: left ? BorderSide.none : const BorderSide(color: Color(0xFF6C63FF), width: 4),
          ),
        ),
      ),
    );
  }
}
