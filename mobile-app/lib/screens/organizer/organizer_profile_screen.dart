import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../services/event_service.dart';
import '../../services/notification_service.dart';
import '../../services/organizer_service.dart';
import '../../services/user_service.dart';
import '../../widgets/primary_button.dart';

class OrganizerProfileScreen extends StatefulWidget {
  const OrganizerProfileScreen({super.key});
  
  static const String routeName = '/organizer-profile';

  @override
  State<OrganizerProfileScreen> createState() => _OrganizerProfileScreenState();
}

class _OrganizerProfileScreenState extends State<OrganizerProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _fullNameController;
  late TextEditingController _orgNameController;
  late TextEditingController _positionController;
  late TextEditingController _phoneController;
  late TextEditingController _bioController;
  late TextEditingController _websiteController;

  bool _isEditing = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fullNameController = TextEditingController();
    _orgNameController = TextEditingController();
    _positionController = TextEditingController();
    _phoneController = TextEditingController();
    _bioController = TextEditingController();
    _websiteController = TextEditingController();
    
    // Fetch profile data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadProfile();
    });
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    await context.read<UserService>().fetchOrganizerProfile();
    final profile = context.read<UserService>().organizerProfile;
    
    if (profile != null) {
      setState(() {
        _fullNameController.text = profile['full_name'] ?? '';
        _orgNameController.text = profile['organization_name'] ?? '';
        _positionController.text = profile['position'] ?? '';
        _phoneController.text = profile['phone'] ?? '';
        _bioController.text = profile['bio'] ?? '';
        _websiteController.text = profile['website'] ?? '';
      });
    }
    setState(() => _isLoading = false);
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _orgNameController.dispose();
    _positionController.dispose();
    _phoneController.dispose();
    _bioController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    
    final userService = context.read<UserService>();
    final success = await userService.updateOrganizerProfile({
      'full_name': _fullNameController.text.trim(),
      'organization_name': _orgNameController.text.trim(),
      'position': _positionController.text.trim(),
      'phone': _phoneController.text.trim(),
      'bio': _bioController.text.trim(),
      'website': _websiteController.text.trim(),
    });

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cập nhật hồ sơ thành công'), backgroundColor: Colors.green),
      );
      setState(() => _isEditing = false);
    } else {
      final error = userService.errorMessage ?? 'Cập nhật thất bại';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final userService = context.watch<UserService>();
    final profile = userService.organizerProfile;
    final isSaving = userService.isLoading && _isEditing;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hồ sơ Ban tổ chức'),
        actions: [
          if (!_isLoading)
            IconButton(
              icon: Icon(_isEditing ? Icons.close : Icons.edit_rounded),
              onPressed: () {
                if (_isEditing) {
                  // Cancel
                  _loadProfile();
                  setState(() => _isEditing = false);
                } else {
                  // Edit mode
                  setState(() => _isEditing = true);
                }
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : (profile == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Không thể tải thông tin hồ sơ'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadProfile,
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Verification Status
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: profile['approval_status'] == 'approved' 
                                ? Colors.green.withOpacity(0.1) 
                                : Colors.orange.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: profile['approval_status'] == 'approved' 
                                  ? Colors.green.withOpacity(0.3) 
                                  : Colors.orange.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                profile['approval_status'] == 'approved' 
                                    ? Icons.verified_rounded 
                                    : Icons.pending_actions_rounded,
                                color: profile['approval_status'] == 'approved' 
                                    ? Colors.green 
                                    : Colors.orange,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Trạng thái xác minh', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                    Text(
                                      profile['approval_status'] == 'approved' ? 'Đã xác minh (Organizer)' : 'Chờ xét duyệt',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: profile['approval_status'] == 'approved' ? Colors.green[700] : Colors.orange[800],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        _buildField(
                          label: 'Họ và tên',
                          controller: _fullNameController,
                          icon: Icons.person_outline,
                          enabled: _isEditing,
                          validator: (v) => v!.isEmpty ? 'Vui lòng nhập họ tên' : null,
                        ),
                        const SizedBox(height: 16),

                        _buildField(
                          label: 'Tên tổ chức',
                          controller: _orgNameController,
                          icon: Icons.business_rounded,
                          enabled: _isEditing,
                          validator: (v) => v!.isEmpty ? 'Vui lòng nhập tên tổ chức' : null,
                        ),
                        const SizedBox(height: 16),

                        _buildField(
                          label: 'Chức vụ',
                          controller: _positionController,
                          icon: Icons.badge_outlined,
                          enabled: _isEditing,
                        ),
                        const SizedBox(height: 16),

                        _buildField(
                          label: 'Số điện thoại',
                          controller: _phoneController,
                          icon: Icons.phone_outlined,
                          enabled: _isEditing,
                          keyboardType: TextInputType.phone,
                        ),
                        const SizedBox(height: 16),

                        _buildField(
                          label: 'Website',
                          controller: _websiteController,
                          icon: Icons.language_rounded,
                          enabled: _isEditing,
                          keyboardType: TextInputType.url,
                        ),
                        const SizedBox(height: 16),

                        _buildField(
                          label: 'Giới thiệu',
                          controller: _bioController,
                          icon: Icons.info_outline_rounded,
                          enabled: _isEditing,
                          maxLines: 4,
                        ),
                        const SizedBox(height: 32),

                        if (_isEditing)
                          PrimaryButton(
                            label: 'Lưu thay đổi',
                            isLoading: isSaving,
                            onPressed: _saveProfile,
                          )
                        else
                          OutlinedButton.icon(
                            onPressed: () async {
                              // Clear all data
                              if (context.mounted) {
                                context.read<EventService>().clearData();
                                context.read<NotificationService>().clearData();
                                context.read<OrganizerService>().clearData();
                              }
                              
                              await context.read<AuthService>().logout();
                              
                              if (context.mounted) {
                                Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
                              }
                            },
                            icon: const Icon(Icons.logout_rounded),
                            label: const Text('Đăng xuất'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red,
                              side: const BorderSide(color: Colors.redAccent),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                          ),
                      ],
                    ),
                  ),
                )),
    );
  }

  Widget _buildField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    required bool enabled,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      maxLines: maxLines,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: maxLines > 1 ? null : Icon(icon, size: 20),
        alignLabelWithHint: maxLines > 1,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        filled: !enabled,
        fillColor: enabled ? Colors.white : const Color(0xFFF1F5F9),
      ),
      validator: validator,
    );
  }
}
