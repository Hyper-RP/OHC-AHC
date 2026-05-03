from rest_framework.generics import RetrieveAPIView

from accounts.serializers import CurrentUserSerializer


class CurrentUserAPIView(RetrieveAPIView):
    serializer_class = CurrentUserSerializer

    def get_object(self):
        return self.request.user
