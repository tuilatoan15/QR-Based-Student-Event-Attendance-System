import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/report_service.dart';

class ReportHistoryScreen extends StatefulWidget {
  const ReportHistoryScreen({super.key});

  static const String routeName = '/report-history';

  @override
  State<ReportHistoryScreen> createState() => _ReportHistoryScreenState();
}

class _ReportHistoryScreenState extends State<ReportHistoryScreen> {
  bool _isLoading = false;
  List<dynamic> _reports = [];

  @override
  void initState() {
    super.initState();
    _fetchReports();
  }

  Future<void> _fetchReports() async {
    setState(() => _isLoading = true);
    final results = await context.read<ReportService>().getMyReports();
    setState(() {
      _reports = results;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFFEA580C);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      appBar: AppBar(
        title: const Text('Lịch sử phản hồi'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchReports,
        child: _isLoading && _reports.isEmpty
            ? const Center(child: CircularProgressIndicator(color: accent))
            : _reports.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.message_outlined, size: 64, color: Colors.grey[300]),
                        const SizedBox(height: 16),
                        const Text('Chưa có báo lỗi hay phản hồi nào.', style: TextStyle(color: Color(0xFF64748B))),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _reports.length,
                    itemBuilder: (context, index) {
                      final r = _reports[index];
                      final bool isResponded = r['status'] == 'responded';
                      
                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: isResponded ? Colors.green[50] : Colors.amber[50],
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          isResponded ? 'Đã phản hồi' : 'Đang chờ',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: isResponded ? Colors.green[700] : Colors.amber[700],
                                          ),
                                        ),
                                      ),
                                      Text(
                                        DateFormat('HH:mm dd/MM/yyyy').format(DateTime.parse(r['created_at']).toLocal()),
                                        style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    r['title'] ?? 'Không tiêu đề',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A)),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    r['content'] ?? '',
                                    style: const TextStyle(fontSize: 13.5, color: Color(0xFF475569)),
                                  ),
                                ],
                              ),
                            ),
                            if (isResponded && r['admin_reply'] != null)
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(16),
                                decoration: const BoxDecoration(
                                  color: Color(0xFFF8FAFF),
                                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
                                  border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Row(
                                      children: [
                                        Icon(Icons.admin_panel_settings_rounded, size: 16, color: accent),
                                        SizedBox(width: 6),
                                        Text('PHẢN HỒI TỪ ADMIN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: accent, letterSpacing: 0.5)),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      r['admin_reply'],
                                      style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A), fontStyle: FontStyle.italic),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
