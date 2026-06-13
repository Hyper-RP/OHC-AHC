from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.http import JsonResponse
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Health check endpoint for Docker/ALB
def health_check(request):
    """
    Health check endpoint for Docker container health checks and ALB target health.
    Returns 200 OK if the application is running.
    """
    return JsonResponse({
        'status': 'healthy',
        'service': 'ohc-ahc',
        'version': '1.0.0'
    })

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('', include('reports.urls')),
    path('accounts/', include('django.contrib.auth.urls')),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/', include('accounts.urls')),
    path('api/ohc/', include('ohc.urls')),
    path('api/ahc/', include('ahc.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/reports/', include('reports.urls')),
]

if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.STATIC_URL, document_root=settings.BASE_DIR / 'static')
