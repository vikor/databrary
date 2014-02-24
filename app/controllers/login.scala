package controllers

import play.api._
import          Play.current
import          mvc._
import          data._
import          libs.openid._
import          libs.concurrent._
import                          Execution.Implicits.defaultContext
import          i18n.Messages
import scala.concurrent.Future
import org.mindrot.jbcrypt.BCrypt
import macros._
import dbrary._
import site._
import models._

private[controllers] sealed class LoginController extends SiteController {

  protected def json(implicit site : SiteRequest[_]) =
    site.identity.json ++
    JsonObject.flatten(
      Some('access -> site.access.group),
      if (site.access.isAdmin) Some('superuser -> site.session.get("superuser").flatMap(Maybe.toLong _).map(_ - System.currentTimeMillis).filter(_ > 0).getOrElse(0L)) else None
    )

  private[controllers] def login(a : Account)(implicit request : SiteRequest[_]) : Future[SimpleResult] = {
    Audit.actionFor(Audit.Action.open, a.id, dbrary.Inet(request.remoteAddress))
    SessionToken.create(a).map { token =>
      (if (request.isApi) Ok(json(new SiteRequest.Auth(request, token)))
      else Redirect(routes.PartyHtml.view(a.id)))
        .withSession("session" -> token.id)
    }
  }

  def post = SiteAction.async { implicit request =>
    val form = new LoginController.LoginForm()._bind
    macros.Async.flatMap(form.email.value, Account.getEmail _).flatMap { acct =>
      def bad =
	macros.Async.foreach[Account, Unit](acct, a => Audit.actionFor(Audit.Action.attempt, a.id, dbrary.Inet(request.remoteAddress)).execute).flatMap { _ =>
	  form().withGlobalError("login.bad")
	  form.Bad
	}
      if (form.password.value.nonEmpty) {
	acct.filter(a => !a.password.isEmpty && BCrypt.checkpw(form.password.value, a.password)).fold(bad)(login)
      } else if (!form.openid.value.isEmpty)
	OpenID.redirectURL(form.openid.value, routes.LoginHtml.openID(form.email.value.getOrElse("")).absoluteURL(true), realm = Some("http://" + request.host))
	  .map(Redirect(_))
	  .recover { case e : OpenIDError => InternalServerError(LoginHtml.viewLogin(e.toString)) }
      else
	bad
    }
  }

  def logout = SiteAction { implicit request =>
    request match {
      case auth : SiteRequest.Auth[_] =>
        for {
          _ <- auth.token.remove
          _ <- Audit.action(Audit.Action.close)
        } yield {}
      case _ =>
    }
    (if (request.isApi) Ok("")
    else Redirect(routes.Site.start))
      .withNewSession
  }

  private final val superuserTime : Long = 60*60*1000
  def superuserOn = SiteAction.rootAccess() { implicit request =>
    val expires = System.currentTimeMillis + superuserTime
    Audit.action(Audit.Action.superuser)
    (if (request.isApi) Ok(json + ('superuser -> superuserTime))
    else Redirect(request.headers.get(REFERER).getOrElse(routes.Site.start.url)))
      .withSession(session + ("superuser" -> expires.toString))
  }

  def superuserOff = SiteAction { implicit request =>
    (if (request.isApi) Ok(json - "superuser")
    else Redirect(request.headers.get(REFERER).getOrElse(routes.Site.start.url)))
      .withSession(session - "superuser")
  }

  def register = SiteAction.async { implicit request =>
    val form = new LoginController.RegistrationForm()._bind
    for {
      e <- Account.getEmail(form.email.value)
      a <- macros.Async.getOrElse(e, {
	Party.create(
	  name = form.name.value,
	  affiliation = Maybe(form.affiliation.value).opt)
	.flatMap(Account.create(_, email = form.email.value))
      })
      _ <- controllers.TokenController.newPassword(Right(a), "register")
    } yield (Ok("sent"))
  }
}

object LoginController extends LoginController {
  private[controllers] def needed(message : String)(implicit request : SiteRequest[_]) : SimpleResult = {
    val msg = Messages(message)
    if (request.isApi) Forbidden(msg)
    else Forbidden(LoginHtml.viewLogin(msg))
  }

  final class LoginForm(implicit request : SiteRequest[_])
    extends HtmlForm[LoginForm](
      routes.LoginHtml.post,
      views.html.party.login(_)) {
    val email = Field(Forms.optional(Forms.email))
    val password = Field(Forms.text)
    val openid = Field(Forms.text(0, 256))
    _mapping.verifying("login.bad", self =>
      (self.email.value.isDefined && self.password.value.nonEmpty) || self.openid.value.nonEmpty)
    def _fill(em : Option[String], op : String = "") : this.type = {
      email.fill(em)
      openid.fill(op)
      _fill
    }
  }

  final class RegistrationForm(implicit request : SiteRequest[_])
    extends HtmlForm[RegistrationForm](
      routes.LoginHtml.register,
      views.html.party.register(_)) {
    val name = Field(Forms.nonEmptyText)
    val email = Field(Forms.email)
    val affiliation = Field(Forms.text)
    val agreement = Field(Forms.checked("agreement.required"))
  }
}

object LoginHtml extends LoginController {
  import LoginController._

  def viewLogin()(implicit request: SiteRequest[_]) : templates.Html =
    views.html.party.login(new LoginForm)
  def viewLogin(err : String, args : Any*)(implicit request: SiteRequest[_]) : templates.Html =
    views.html.party.login {
      val form = new LoginForm
      form().withGlobalError(err, args)
      form
    }

  def view = SiteAction { implicit request =>
    request.user.fold(Ok(viewLogin()))(u => Redirect(u.party.pageURL))
  }

  def openID(email : String) = SiteAction.async { implicit request =>
    val em = Maybe(email).opt
    (for {
      info <- OpenID.verifiedId
      acct <- Account.getOpenid(info.id, em)
      r <- acct.fold {
	val form = new LoginForm
	form._fill(em, info.id)
	form.openid.withError("login.openID.notFound")
	form.Bad
      } (login)
    } yield (r))
    .recover { case e : OpenIDError => InternalServerError(viewLogin(e.toString)) }
  }

  def registration = SiteAction.async { implicit request =>
    new RegistrationForm().Ok
  }
}

object LoginApi extends LoginController {
  def get = SiteAction { implicit request =>
    Ok(json)
  }
}
