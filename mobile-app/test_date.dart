import 'package:intl/intl.dart';

void main() {
  final utcStr = '2026-03-19T14:41:00.000Z';
  final parsed = DateTime.parse(utcStr);
  final toLocal = parsed.toLocal();
  final fmt = DateFormat('HH:mm');
  print('isUtc: ${parsed.isUtc}');
  print('parsed (no tolocal): ${fmt.format(parsed)}');
  print('parsed (tolocal): ${fmt.format(toLocal)}');
}
