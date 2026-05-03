from django.urls import include, path
from rest_framework.routers import DefaultRouter

from payments.views import InvoiceViewSet, PaymentViewSet

router = DefaultRouter()
router.register("invoices", InvoiceViewSet, basename="invoice")
router.register("transactions", PaymentViewSet, basename="payment")

urlpatterns = [
    path("", include(router.urls)),
]
