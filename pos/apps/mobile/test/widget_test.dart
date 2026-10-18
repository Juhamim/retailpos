import 'package:flutter_test/flutter_test.dart';
import 'package:retailflow_mobile_pos/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const RetailFlowMobileApp());
    expect(find.byType(RetailFlowMobileApp), findsOneWidget);
  });
}
