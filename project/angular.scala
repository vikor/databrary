import sbt._
import Keys._
import scala.util.matching.Regex

object AngularTemplate extends play.PlayAssetsCompiler with Plugin {
  val directory = SettingKey[String]("angular-template-directory")
  val entryPoints = SettingKey[PathFinder]("angular-template-entry-points")
  val options = SettingKey[Seq[String]]("angular-template-options")

  private def read(file : File) : String =
    scalax.file.Path(file).string

  private final case class Replacer(source : String, regex : Regex) {
    val matches = regex.findAllMatchIn(source).toSeq
    def apply(f : Regex.Match => String) : String = {
      val b = new StringBuilder
      var i = 0
      matches.foreach { m =>
	b ++= source.substring(i, m.start)
	b ++= f(m)
	i = m.end
      }
      b ++= source.substring(i, source.length)
      b.toString
    }
  }

  private trait AllTemplater {
    def apply(l : Seq[File], p : String => String = identity) : String
  }

  private abstract class AllTemplate(pre : String, post : String) extends AllTemplater {
    protected def each(f : File, p : String => String) : String
    final def apply(l : Seq[File], p : String => String = identity) =
      (pre +: l.map(each(_, p)) :+ post).mkString("\n")
  }
  private final class AllSubstTemplate(pre : String = "", each : String, post : String = "") extends AllTemplate(pre, post) {
    val replacer = Replacer(each, AllSubstTemplate.eachRegex)
    protected def each(f : File, p : String => String) : String =
      replacer(_.matched match {
	case "@FILENAME@" => f.getName
	case "@CONTENTS@" => p(read(f))
      })
  }
  private object AllSubstTemplate {
    private final val templateRegex = "(?ms)(?:(.*)^\\{\\{\\{$)?(.*?)(?:^\\}\\}\\}$(.*))?".r
    private final val eachRegex = "@FILENAME@|@CONTENTS@".r
    private def coalesce[A](x : A, default : A = "") : A = Option(x).getOrElse(default)

    def apply(t : String) =
      t match {
	case templateRegex(pre, each, post) =>
	  new AllSubstTemplate(coalesce(pre), each, coalesce(post))
      }
  }

  private val compressor = new com.googlecode.htmlcompressor.compressor.HtmlCompressor
  compressor.setRemoveIntertagSpaces(true)

  private def compile(file : File, options : Seq[String]) : (String, Option[String], Seq[File]) = {
    if (file.getName.equals("_all.html")) {
      val all = PathFinder(file.getParentFile).descendantsExcept("*.html", "_*").get
      val tpl = AllSubstTemplate(read(file))
      // compressor won't go inside <script>s so we have to do two passes (or compress tpl ahead of time)
      (tpl(all), Some(compressor.compress(tpl(all, compressor.compress))), all : Seq[File])
    } else {
      val c = read(file)
      (c, Some(compressor.compress(c)), Nil)
    }
  }

  val Compiler = AssetsCompiler("angular",
    (_ / "assets" ** "*.html"),
    entryPoints,
    { (name, min) => if (min) name.replace(".html", ".min.html") else name },
    compile,
    options
  )

  override val projectSettings = Seq(
    directory := "templates",
    entryPoints <<= (sourceDirectory in Compile, directory){ (base, dir) =>
      base / "assets" / dir ** "*.html"
    },
    options := Nil
  )
}