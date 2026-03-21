import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config/api_config.dart';

import '../models/event.dart';
import '../models/registration.dart';
import '../services/event_service.dart';
import '../services/auth_service.dart';
import '../widgets/primary_button.dart';
import 'qr_screen.dart';

class EventDetailScreen extends StatefulWidget {
  const EventDetailScreen({super.key});
  static const String routeName = '/events/detail';

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  Event? _event;
  Registration? _registration;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final id = ModalRoute.of(context)?.settings.arguments as int?;
    if (id != null && _event == null) _loadEvent(id);
  }

  Future<void> _loadEvent(int id) async {
    final svc = context.read<EventService>();
    final event = await svc.fetchEventDetail(id);
    await svc.fetchMyEvents();
    if (mounted) setState(() { _event = event; _registration = svc.getRegistration(id); });
  }

  Future<void> _register() async {
    final id = _event?.id;
    if (id == null) return;
    final svc = context.read<EventService>();
    final reg = await svc.registerForEvent(id);
    if (!mounted) return;
    if (reg != null) {
      setState(() => _registration = reg);
      _showSnack('Đăng ký thành công! 🎉', isError: false);
    } else if (svc.errorMessage != null) {
      _showSnack(svc.errorMessage!, isError: true);
    }
  }

  Future<void> _showQR() async {
    if (_registration == null || !mounted) return;
    Navigator.of(context).pushNamed(QRScreen.routeName, arguments: {'event': _event, 'registration': _registration});
  }

  Future<void> _cancel() async {
    final id = _event?.id;
    if (id == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Huỷ đăng ký', style: TextStyle(fontWeight: FontWeight.w700)),
        content: const Text('Bạn có chắc muốn huỷ đăng ký sự kiện này?', style: TextStyle(color: Color(0xFF64748B))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Không')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            child: const Text('Huỷ đăng ký'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    final svc = context.read<EventService>();
    final ok = await svc.cancelRegistration(id);
    if (!mounted) return;
    if (ok) { setState(() => _registration = null); _showSnack('Đã huỷ đăng ký', isError: false); }
    else if (svc.errorMessage != null) _showSnack(svc.errorMessage!, isError: true);
  }

  void _showSnack(String msg, {required bool isError}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? const Color(0xFFEF4444) : const Color(0xFF16A34A),
    ));
  }

  String _fmtDateTime(DateTime dt) {
    final d = dt.toLocal();
    const months = ['Thg 1','Thg 2','Thg 3','Thg 4','Thg 5','Thg 6','Thg 7','Thg 8','Thg 9','Thg 10','Thg 11','Thg 12'];
    return '${d.day} ${months[d.month - 1]}, ${d.year}  ${d.hour.toString().padLeft(2,'0')}:${d.minute.toString().padLeft(2,'0')}';
  }

  Color get _accent {
    if (_event == null) return const Color(0xFF00CCFF);
    final colors = [const Color(0xFF00CCFF), const Color(0xFF7C3AED), const Color(0xFF0891B2), const Color(0xFF059669), const Color(0xFFEA580C)];
    return colors[_event!.id % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    final svc = context.watch<EventService>();

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FF),
      body: _event == null
          ? Center(child: svc.isLoading ? CircularProgressIndicator(color: _accent) : const Text('Đang tải...'))
          : CustomScrollView(
              slivers: [
                // Hero sliver app bar
                SliverAppBar(
                  expandedHeight: 220,
                  pinned: true,
                  backgroundColor: _accent,
                  leading: Padding(
                    padding: const EdgeInsets.all(8),
                    child: GestureDetector(
                      onTap: () { if (Navigator.canPop(context)) Navigator.pop(context); },
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 16),
                      ),
                    ),
                  ),
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [_accent, _accent.withOpacity(0.7), const Color(0xFF0EA5E9)],
                        ),
                      ),
                      child: Stack(
                        children: [
                          // decorative circles
                          Positioned(top: -30, right: -30, child: _Circle(size: 120, color: Colors.white.withOpacity(0.06))),
                          Positioned(bottom: 20, left: -20, child: _Circle(size: 80, color: Colors.white.withOpacity(0.05))),
                          // content
                          Positioned(
                            left: 20, right: 20, bottom: 24,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.event_rounded, size: 12, color: Colors.white),
                                      const SizedBox(width: 5),
                                      Text(_event!.startTime.isAfter(DateTime.now()) ? 'Sắp tới' : 'Sự kiện',
                                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(_event!.title, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.3), maxLines: 2, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on_rounded, size: 14, color: Colors.white70),
                                    const SizedBox(width: 4),
                                    Expanded(child: Text(_event!.location, style: const TextStyle(color: Colors.white70, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Registration status banner
                        if (_registration != null)
                          Container(
                            padding: const EdgeInsets.all(14),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)]),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFBBF7D0)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: const BoxDecoration(color: Color(0xFF16A34A), shape: BoxShape.circle),
                                  child: const Icon(Icons.check_rounded, color: Colors.white, size: 16),
                                ),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Đã đăng ký', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF15803D), fontSize: 14)),
                                      Text('Bạn đã đăng ký sự kiện này', style: TextStyle(color: Color(0xFF16A34A), fontSize: 12.5)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Schedule card
                        _SectionCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _CardLabel('Lịch trình', icon: Icons.schedule_rounded, color: _accent),
                              const SizedBox(height: 14),
                              _TimeRow(label: 'Bắt đầu', time: _fmtDateTime(_event!.startTime), icon: Icons.play_circle_outline_rounded, color: const Color(0xFF16A34A)),
                              const Divider(height: 20, color: Color(0xFFF1F5F9)),
                              _TimeRow(label: 'Kết thúc', time: _fmtDateTime(_event!.endTime), icon: Icons.stop_circle_outlined, color: const Color(0xFFEA580C)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Description
                        if (_event!.description != null && _event!.description!.isNotEmpty) ...[
                          _SectionCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _CardLabel('Mô tả', icon: Icons.info_outline_rounded, color: _accent),
                                const SizedBox(height: 10),
                                HtmlWidget(
                                  _event!.description!,
                                  onTapUrl: (url) async {
                                    final u = Uri.parse(url);
                                    if (await canLaunchUrl(u)) await launchUrl(u);
                                    return true;
                                  },
                                  textStyle: const TextStyle(fontSize: 14, color: Color(0xFF475569), height: 1.6),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],

                        // Image Gallery
                        if (_event!.images.isNotEmpty) ...[
                          _SectionCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _CardLabel('Hình ảnh', icon: Icons.photo_library_rounded, color: _accent),
                                const SizedBox(height: 10),
                                ListView.separated(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  itemCount: _event!.images.length,
                                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                                  itemBuilder: (ctx, idx) {
                                    return ClipRRect(
                                      borderRadius: BorderRadius.circular(10),
                                      child: Image.network(
                                        '${ApiConfig.baseUrl}${_event!.images[idx]}',
                                        width: double.infinity,
                                        fit: BoxFit.fitWidth,
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],

                        // Capacity
                        _SectionCard(
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(color: _accent.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                                child: Icon(Icons.people_alt_rounded, color: _accent, size: 22),
                              ),
                              const SizedBox(width: 14),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Sức chứa', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontWeight: FontWeight.w500)),
                                  Text('${_event!.maxParticipants} người', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Actions
                        if (context.read<AuthService>().currentUser?.role == 'student') ...[
                          if (_registration == null)
                            PrimaryButton(
                              label: 'Đăng ký tham dự',
                              isLoading: svc.isLoading,
                              onPressed: _register,
                            )
                          else
                            Column(
                              children: [
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    onPressed: svc.isLoading ? null : _showQR,
                                    icon: const Icon(Icons.qr_code_2_rounded),
                                    label: const Text('Hiển thị mã QR'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: _accent,
                                      padding: const EdgeInsets.symmetric(vertical: 15),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton.icon(
                                    onPressed: svc.isLoading ? null : _cancel,
                                    icon: const Icon(Icons.close_rounded, size: 18),
                                    label: const Text('Huỷ đăng ký'),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: const Color(0xFFEF4444),
                                      side: const BorderSide(color: Color(0xFFFECACA)),
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          const SizedBox(height: 32),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _Circle extends StatelessWidget {
  const _Circle({required this.size, required this.color});
  final double size;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(width: size, height: size, decoration: BoxDecoration(color: color, shape: BoxShape.circle));
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 2))],
    ),
    child: child,
  );
}

class _CardLabel extends StatelessWidget {
  const _CardLabel(this.text, {required this.icon, required this.color});
  final String text;
  final IconData icon;
  final Color color;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(width: 7),
      Text(text, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
    ],
  );
}

class _TimeRow extends StatelessWidget {
  const _TimeRow({required this.label, required this.time, required this.icon, required this.color});
  final String label;
  final String time;
  final IconData icon;
  final Color color;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, color: color, size: 18),
      const SizedBox(width: 10),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11.5, color: Color(0xFF94A3B8), fontWeight: FontWeight.w500)),
          Text(time, style: const TextStyle(fontSize: 13.5, color: Color(0xFF0F172A), fontWeight: FontWeight.w600)),
        ],
      ),
    ],
  );
}