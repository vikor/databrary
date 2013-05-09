package controllers

import play.api._
import          Play.current
import          mvc._
import          i18n.Messages
import models._

object Application extends Controller {
  
  def start = AccountAction(
    Login.viewLogin,
    { request : AccountRequest[AnyContent] => 
      Entity.viewEntity(Some(request.account), request.account.entity) 
    }
  )

}
