from django.core.management.base import BaseCommand
from expenses.models import Category

class Command(BaseCommand):
    help = 'Create default expense categories for Indian students'

    def handle(self, *args, **options):
        categories = [
            {'name': 'Food', 'icon': '🍽️', 'color': '#e74c3c'},
            {'name': 'Transport', 'icon': '🚌', 'color': '#3498db'},
            {'name': 'Books', 'icon': '📚', 'color': '#2ecc71'},
            {'name': 'Entertainment', 'icon': '🎬', 'color': '#f39c12'},
            {'name': 'Health', 'icon': '🏥', 'color': '#e67e22'},
            {'name': 'Shopping', 'icon': '🛒', 'color': '#9b59b6'},
            {'name': 'Education', 'icon': '🎓', 'color': '#1abc9c'},
            {'name': 'Mobile/Internet', 'icon': '📱', 'color': '#34495e'},
            {'name': 'Miscellaneous', 'icon': '📦', 'color': '#95a5a6'},
            {'name': 'Savings', 'icon': '💰', 'color': '#27ae60'},
        ]

        created_count = 0
        for category_data in categories:
            category, created = Category.objects.get_or_create(
                name=category_data['name'],
                defaults={
                    'icon': category_data['icon'],
                    'color': category_data['color']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} categories')
        )
