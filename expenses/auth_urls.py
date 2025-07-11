from django.urls import path
from django.contrib.auth import views as auth_views
from . import auth_views as custom_auth_views

urlpatterns = [
    path('signup/', custom_auth_views.signup_view, name='signup'),
]
