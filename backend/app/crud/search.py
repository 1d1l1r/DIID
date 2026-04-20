from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.card import Card
from app.models.document import Document
from app.models.password_entry import PasswordEntry
from app.models.profile import Profile
from app.schemas.search import (
    CardHit,
    DocumentHit,
    PasswordHit,
    ProfileHit,
    SearchResults,
)


def search_all(db: Session, q: str) -> SearchResults:
    pattern = f"%{q}%"
    q_lower = q.lower()

    profiles = (
        db.query(Profile)
        .filter(
            or_(
                Profile.last_name.ilike(pattern),
                Profile.first_name.ilike(pattern),
                Profile.middle_name.ilike(pattern),
                Profile.iin.ilike(pattern),
                Profile.phone.ilike(pattern),
            )
        )
        .limit(20)
        .all()
    )

    documents = (
        db.query(Document)
        .filter(
            or_(
                Document.document_number.ilike(pattern),
                Document.iin.ilike(pattern),
                Document.issued_by.ilike(pattern),
            )
        )
        .limit(20)
        .all()
    )

    cards = (
        db.query(Card)
        .filter(
            or_(
                Card.bank_name.ilike(pattern),
                Card.card_last_four.ilike(pattern),
                Card.cardholder_name.ilike(pattern),
            )
        )
        .limit(20)
        .all()
    )

    passwords = (
        db.query(PasswordEntry)
        .filter(
            or_(
                PasswordEntry.title.ilike(pattern),
                PasswordEntry.login.ilike(pattern),
                PasswordEntry.url.ilike(pattern),
                PasswordEntry.category.ilike(pattern),
            )
        )
        .limit(20)
        .all()
    )

    return SearchResults(
        query=q,
        profiles=[
            ProfileHit(
                id=p.id,
                full_name=" ".join(filter(None, [p.last_name, p.first_name, p.middle_name])),
                iin=p.iin,
                phone=p.phone,
                matched_on=_profile_field(p, q_lower),
            )
            for p in profiles
        ],
        documents=[
            DocumentHit(
                id=d.id,
                profile_id=d.profile_id,
                type=d.type,
                document_number=d.document_number,
                matched_on=_document_field(d, q_lower),
            )
            for d in documents
        ],
        cards=[
            CardHit(
                id=c.id,
                profile_id=c.profile_id,
                bank_name=c.bank_name,
                card_last_four=c.card_last_four,
                matched_on=_card_field(c, q_lower),
            )
            for c in cards
        ],
        passwords=[
            PasswordHit(
                id=pw.id,
                profile_id=pw.profile_id,
                title=pw.title,
                login=pw.login,
                matched_on=_password_field(pw, q_lower),
            )
            for pw in passwords
        ],
    )


def _profile_field(p: Profile, q: str) -> str:
    if p.iin and q in p.iin.lower():
        return "iin"
    if p.phone and q in p.phone.lower():
        return "phone"
    return "name"


def _document_field(d: Document, q: str) -> str:
    if d.document_number and q in d.document_number.lower():
        return "document_number"
    if d.iin and q in d.iin.lower():
        return "iin"
    return "issued_by"


def _card_field(c: Card, q: str) -> str:
    if c.card_last_four and q in c.card_last_four:
        return "card_number"
    if c.cardholder_name and q in c.cardholder_name.lower():
        return "cardholder_name"
    return "bank_name"


def _password_field(pw: PasswordEntry, q: str) -> str:
    if pw.login and q in pw.login.lower():
        return "login"
    if pw.url and q in pw.url.lower():
        return "url"
    if pw.category and q in pw.category.lower():
        return "category"
    return "title"
