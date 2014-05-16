package dbrary

import java.net._

object url extends URLStreamHandlerFactory {
  sealed abstract class TransformedURLHandler extends URLStreamHandler {
    protected def transform(u : URL) : URL
    final protected def openConnection(u : URL) : URLConnection =
      transform(u).openConnection()
    final override protected def openConnection(u : URL, p : Proxy) : URLConnection =
      transform(u).openConnection(p)
  }

  object DOIHandler extends TransformedURLHandler {
    private val DOIRegex = "10\\.[\\.0-9]+/".r
    def validDOI(s : String) =
      DOIRegex.findPrefixOf(s).nonEmpty

    protected def transform(u : URL) =
      new URL("http", "dx.doi.org", "/" + u.getFile)
    override protected def parseURL(u : URL, spec : String, start : Int, limit : Int) {
      val doi = spec.substring(start, limit)
      if (!validDOI(doi))
	throw new RuntimeException("Invalid DOI")
      setURL(u, "doi", u.getHost, u.getPort, u.getAuthority, u.getUserInfo, doi, u.getQuery, u.getRef)
    }
  }

  object HDLHandler extends TransformedURLHandler {
    protected def transform(u : URL) =
      new URL("http", "hdl.handle.net", "/" + u.getFile)
    override protected def parseURL(u : URL, spec : String, start : Int, limit : Int) {
      val hdl = spec.substring(start, limit)
      setURL(u, "hdl", u.getHost, u.getPort, u.getAuthority, u.getUserInfo, hdl, u.getQuery, u.getRef)
    }
  }

  def createURLStreamHandler(protocol : String) : URLStreamHandler = protocol match {
    case "doi" => DOIHandler
    case "hdl" => HDLHandler
    case _ => null
  }

  try {
    java.net.URL.setURLStreamHandlerFactory(this)
  } catch {
    case e : Error if e.getMessage.equals("factory already defined") => () /* this defeats automatic reloading, but that's probably okay */
  }

  def parse(s : String) : Option[URL] =
    if (DOIHandler.validDOI(s))
      Some(new URL("doi", null, s))
    else
      scala.util.control.Exception.catching(classOf[MalformedURLException]).opt(new URL(s))
  def normalize(u : URL) : URL =
    u.openConnection.getURL

  val formatter : play.api.data.format.Formatter[URL] = new play.api.data.format.Formatter[URL] {
    override val format = Some(("format.url", Nil))
    def bind(key : String, data : Map[String, String]) =
      data.get(key).flatMap(parse _).toRight(Seq(play.api.data.FormError(key, "url.invalid", Nil)))
    def unbind(key : String, value : URL) = Map(key -> value.toString)
  }
}