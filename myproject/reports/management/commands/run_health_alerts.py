from django.core.management.base import BaseCommand

from reports.services import run_automated_health_alerts


class Command(BaseCommand):
    help = "Generate automated alerts for expired certificates and upcoming checkups."

    def add_arguments(self, parser):
        parser.add_argument("--days-ahead", type=int, default=7)

    def handle(self, *args, **options):
        result = run_automated_health_alerts(days_ahead=options["days_ahead"])
        self.stdout.write(
            self.style.SUCCESS(
                "Generated alerts: "
                f"expired={result['expired_certificate_alerts']}, "
                f"upcoming_checkups={result['upcoming_checkup_alerts']}"
            )
        )
