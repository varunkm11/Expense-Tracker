from flask import Flask, render_template, redirect, url_for, request, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from forms import LoginForm, RegisterForm, TransactionForm, SplitExpenseForm
from models import db, User, Category, Transaction, ExpenseSplit
from datetime import datetime, date
from sqlalchemy import extract, func