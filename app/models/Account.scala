package models

import play.api.Play.current
import play.api.db.slick
import             slick.DB
import             slick.Config.driver.simple._
import java.sql.Timestamp

case class Account(id : Int, username : String, var email : String, var openid : Option[String]) extends TableRow {
  override def hashCode = id
  override def equals(a : Any) = a match {
    case Account(i, _, _, _) => i == id
    case _ => false
  }

  def commit = DB.withSession { implicit session =>
    Account.byId(id).map(_.mutable) update (email, openid)
  }

  private val _entity = CachedVal[Entity](Entity.get(id))
  def entity : Entity = _entity
  def access : Permission.Value = entity.access
}

object Account extends Table[Account]("account") {
  def id = column[Int]("entity")
  def username = column[String]("username", O.PrimaryKey, O.DBType("varchar(32)"))
  def created = column[Timestamp]("created")
  def email = column[String]("email", O.DBType("varchar(256)"))
  def openid = column[Option[String]]("openid", O.DBType("varchar(256)"))

  def * = id ~ username ~ email ~ openid <> (Account.apply _, Account.unapply _)
  def mutable = email ~ openid

  def idKey = index("account_entity_key", id, unique = true)
  def openidKey = index("account_openid_key", openid, unique = false)
  def entity = foreignKey("account_entity_fkey", id, Entity)(_.id)

  def byId(i : Int) = Query(this).where(_.id === i)
  def byUsername(u : String) = Query(this).filter(_.username === u)
  def byOpenid(o : String) = Query(this).filter(_.openid === o)

  def firstOption(q : Query[Account.type, Account]) : Option[Account] =
    DB.withSession { implicit session =>
      (for { a <- q ; (e, c) <- a.entity.map(e => (e, Authorize._access_check(e.id))) } yield (a,e,c)).firstOption.map(
        { case (a,e,c) => 
          a._entity() = Entity.cache(e, c.getOrElse(Permission.NONE))
          a 
        }
      )
    }

  def getId(i : Int) : Option[Account] =
    firstOption(byId(i))
  def getUsername(u : String) : Option[Account] =
    firstOption(byUsername(u))
}
