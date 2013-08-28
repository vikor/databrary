package dbrary

import org.postgresql._
import org.postgresql.util._
import java.sql.{Timestamp,Date,SQLException}
import anorm._
import play.api.mvc.{PathBindable,JavascriptLitteral}

class PGObject(pgType : String, pgValue : String) extends PGobject {
  setType(pgType)
  setValue(pgValue)
}

trait PGType[A] {
  val pgType : String
  def pgGet(s : String) : A
  def pgPut(t : A) : String

  implicit val column : Column[A] = Column.nonNull[A] { (value, meta) =>
    val MetaDataItem(qualified, nullable, clazz) = meta
    value match {
      case obj: PGobject if obj.getType == pgType => Right(pgGet(obj.getValue))
      case obj: PGobject => Left(TypeDoesNotMatch("Incorrect type of object " + value + ":" + obj.getType + " for column " + qualified + ":" + pgType))
      case _ => Left(TypeDoesNotMatch("Cannot convert " + value + ":" + value.asInstanceOf[AnyRef].getClass + " to PGobject for column " + qualified))
    }
  }

  implicit val statement : ToStatement[A] = new ToStatement[A] {
    def set(s: java.sql.PreparedStatement, index: Int, a: A) =
      s.setObject(index, new PGObject(pgType, pgPut(a)))
  }
}

object Anorm {
  implicit val columnTimestamp : Column[Timestamp] = Column.nonNull { (value, meta) =>
    val MetaDataItem(qualified, nullable, clazz) = meta
    value match {
      case ts: Timestamp => Right(ts)
      case _ => Left(TypeDoesNotMatch("Cannot convert " + value + ":" + value.asInstanceOf[AnyRef].getClass + " to Timestamp for column " + qualified))
    }
  }

  implicit val columnDate : Column[Date] = Column.nonNull { (value, meta) =>
    val MetaDataItem(qualified, nullable, clazz) = meta
    value match {
      case d: Date => Right(d)
      case _ => Left(TypeDoesNotMatch("Cannot convert " + value + ":" + value.asInstanceOf[AnyRef].getClass + " to Date for column " + qualified))
    }
  }

  def toStatementMap[A,S](f : A => S)(implicit ts : ToStatement[S]) : ToStatement[A] = new ToStatement[A] {
    def set(s: java.sql.PreparedStatement, index: Int, a: A) =
      ts.set(s, index, f(a))
  }
  def columnMap[A,S](f : S => A)(implicit c : Column[S]) : Column[A] = Column(
    c(_, _).map(f(_))
  )
}

case class Interval(seconds : Double) 
  extends scala.math.Ordered[Interval] {
  /*
     with scala.runtime.FractionalProxy[Double] 
     with scala.runtime.OrderedProxy[Double] {
     def self = seconds
  protected def ord = scala.math.Ordering.Double
  protected def integralNum = scala.math.Numeric.DoubleAsIfIntegral
  protected def num = scala.math.Numeric.DoubleIsFractional
  */
  def millis = 1000*seconds
  def nanos = 1000000000*seconds
  def samples(rate : Double) = math.round(rate*seconds)
  def +(other : Interval) = Interval(seconds + other.seconds)
  def -(other : Interval) = Interval(seconds - other.seconds)
  def compare(other : Interval) = seconds.compare(other.seconds)

  /* This is unfortuante but I can't find any other reasonable formatting options outside the postgres server itself: */
  override def toString = {
    val s = "%06.3f".format(seconds % 60)
    val m = seconds.toInt / 60
    if (m >= 60)
      "%02d:%02d:%s".format(m / 60, m % 60, s)
    else
      "%02d:%s".format(m, s)
  }
}
object Interval {
  def apply(i : PGInterval) : Interval =
    Interval(60*(60*(24*(30*(12.175*i.getYears + i.getMonths) + i.getDays) + i.getHours) + i.getMinutes) + i.getSeconds)

  object pgType extends PGType[Interval] {
    val pgType = "interval"
    def pgGet(s : String) = Interval(new PGInterval(s))
    def pgPut(i : Interval) = i.seconds.toString
  }

  implicit val column : Column[Interval] = Column.nonNull[Interval] { (value, meta) =>
    val MetaDataItem(qualified, nullable, clazz) = meta
    value match {
      case int : PGInterval => Right(Interval(int))
      case _ => Left(TypeDoesNotMatch("Cannot convert " + value + ":" + value.asInstanceOf[AnyRef].getClass + " to PGInterval for column " + qualified))
    }
  }
  implicit val statement : ToStatement[Interval] = new ToStatement[Interval] {
    def set(s: java.sql.PreparedStatement, index: Int, a: Interval) =
      s.setObject(index, new PGInterval(0, 0, 0, 0, 0, a.seconds))
  }

  implicit val pathBindable : PathBindable[Interval] = PathBindable.bindableDouble.transform(apply _, _.seconds)
  implicit val javascriptLitteral : JavascriptLitteral[Interval] = new JavascriptLitteral[Interval] {
    def to(value : Interval) = value.seconds.toString
  }
}

case class Inet(ip : String)
object Inet extends PGType[Inet]{
  val pgType = "inet"
  def pgGet(s : String) = Inet(s)
  def pgPut(i : Inet) = i.ip
}
