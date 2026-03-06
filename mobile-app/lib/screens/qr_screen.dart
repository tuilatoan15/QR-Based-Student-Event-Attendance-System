import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

class QRScreen extends StatelessWidget {
  const QRScreen({super.key});

  static const String routeName = '/qr';

  @override
  Widget build(BuildContext context) {
    final qrToken = ModalRoute.of(context)?.settings.arguments as String? ?? '';

    return Scaffold(
      appBar: AppBar(title: const Text('Your QR Code')),
      body: Center(
        child: qrToken.isEmpty
            ? const Text('No QR token available.')
            : QrImageView(
                data: qrToken,
                version: QrVersions.auto,
                size: 250.0,
              ),
      ),
    );
  }
}

