import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../services/event_service.dart';

class AdminScanScreen extends StatefulWidget {
  const AdminScanScreen({super.key});

  static const String routeName = '/admin-scan';

  @override
  State<AdminScanScreen> createState() => _AdminScanScreenState();
}

class _AdminScanScreenState extends State<AdminScanScreen> {
  late MobileScannerController controller;
  String? studentName;
  String? eventTitle;
  String? checkinTime;
  String statusMessage = '';
  bool isProcessing = false;

  @override
  void initState() {
    super.initState();
    controller = MobileScannerController();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  void _handleBarcode(BarcodeCapture capture) async {
    if (isProcessing) return;
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;
    final code = barcodes.first.rawValue;
    if (code == null) return;

    setState(() {
      isProcessing = true;
      statusMessage = 'Processing...';
    });

    final eventService = context.read<EventService>();
    final data = await eventService.checkIn(code);

    if (data != null) {
      setState(() {
        studentName = data['student_name'] as String?;
        eventTitle = data['event_title'] as String?;
        checkinTime = data['check_in_time']?.toString();
        statusMessage = '✅ Student checked in successfully!';
      });
    } else {
      setState(() {
        statusMessage =
            '❌ ${eventService.errorMessage ?? 'Invalid QR code or check-in failed'}';
      });
    }

    setState(() {
      isProcessing = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan Student QR')),
      body: Column(
        children: [
          Expanded(
            child: MobileScanner(
              controller: controller,
              onDetect: _handleBarcode,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(statusMessage,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (studentName != null) ...[
                  Text('Student: $studentName'),
                  const SizedBox(height: 4),
                ],
                if (eventTitle != null) ...[
                  Text('Event: $eventTitle'),
                  const SizedBox(height: 4),
                ],
                if (checkinTime != null) ...[
                  Text('Time: $checkinTime'),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
