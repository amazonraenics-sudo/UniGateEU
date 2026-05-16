import https from 'https'

const content = `**A University With 570 Years of History**

Nestled at the edge of the Black Forest in southwest Germany, the University of Freiburg (Albert-Ludwigs-Universität Freiburg) is one of Europe's oldest and most distinguished universities. Founded in 1457, it has spent more than five centuries producing scientists, philosophers, lawyers, and Nobel laureates — and today it continues to attract students from over 120 countries who come for its academic reputation, exceptional quality of life, and tuition-free education.

This is a university where you can finish a seminar on environmental policy and be hiking in the Black Forest within thirty minutes. It is not a coincidence that Freiburg is also known as Germany's greenest city.

**Academic Strengths and Rankings**

Freiburg consistently ranks among Germany's top ten universities and within the global top 150. It is particularly distinguished in several fields that matter for international students.

Medicine and life sciences are among Freiburg's strongest departments — the university medical centre is one of the largest teaching hospitals in Germany, and the Faculty of Medicine is regularly cited as among the best in the country. For students pursuing medical research, neuroscience, or pharmacy, Freiburg offers access to cutting-edge facilities and a faculty that includes members of the German National Academy of Sciences.

Environmental science and sustainability is where Freiburg genuinely stands apart. The city itself is a model of sustainable urban planning — it has more solar panels per capita than almost any city in Europe, an extensive tram and cycling network, and a culture deeply rooted in environmental consciousness. The university's research in climate science, environmental law, and sustainability studies reflects this identity, and the interdisciplinary environment clusters in this area attract researchers from across Europe.

Law and economics programs at Freiburg carry a particularly strong reputation. The Freiburg School of Economics, which gave rise to the ordoliberal economic philosophy that shaped post-war German economic policy, originated here. Students of economics and public policy will find the department intellectually serious and historically significant.

Humanities, social sciences, and philosophy are among the oldest departments at Freiburg, home to some of the most influential thinkers in modern intellectual history. Martin Heidegger taught here. Edmund Husserl, the founder of phenomenology, spent his most productive years at Freiburg. Hannah Arendt studied here. If philosophy and critical theory are your field, this is hallowed ground.

**Tuition and Cost of Living**

Like most German public universities, the University of Freiburg charges no tuition fees for international students. You pay only a semester contribution of approximately €170, which includes a public transport pass covering the entire Freiburg city network and surrounding region.

Living costs in Freiburg are moderate by German standards — notably more affordable than Munich or Frankfurt. A realistic monthly budget looks like this: student accommodation in a university dormitory or shared flat runs €350 to €600 per month. Groceries and daily expenses add another €200 to €300. The included transport pass eliminates commuting costs. Most international students live comfortably on €750 to €1,000 per month in total.

The university runs its own student accommodation through the Studierendenwerk Freiburg, and applying for a place in a Studentenwohnheim as early as possible is strongly recommended — demand is high and the affordable spots go quickly.

**English-Taught Programs**

While many undergraduate programs are delivered in German, the University of Freiburg has significantly expanded its English-language offerings at the Master's level. Notable programs taught entirely in English include the Master of Science in Sustainable Systems — an interdisciplinary program combining ecology, social science, and governance — as well as programs in European culture, linguistics, and several science disciplines.

The university also offers a range of international programs and exchanges through the Erasmus+ network, and its International Office runs a comprehensive orientation and integration program for incoming international students.

**Student Life in Freiburg**

Freiburg is consistently voted one of Germany's most liveable cities for students, and the reasons are immediately obvious to anyone who visits. The city's Altstadt (old town) is built around a medieval market square and a stunning Gothic cathedral, the Freiburger Münster, which serves as the social hub of the city. Small channels of water called Bächle run through the cobblestone streets — a medieval irrigation system now used for cooling feet in summer.

The surrounding region is extraordinary. The Black Forest begins at the city's edge, offering hiking, mountain biking, skiing, and some of the most dramatic natural scenery in central Europe. The Rhine Valley wine region is on one side. France and Switzerland are within easy reach — Basel is 45 minutes by train, Strasbourg is an hour.

The student population of approximately 25,000 gives the city an energetic, youthful atmosphere without the overwhelming scale of Berlin or Munich. Student bars, cultural events, jazz clubs, and outdoor markets fill the calendar throughout the academic year.

**How to Apply**

Applications to the University of Freiburg for international students are generally submitted through uni-assist, the centralized portal for international applicants to German universities. Required documents typically include your academic transcripts, degree certificate, a language certificate (German B2/C1 for German-taught programs, IELTS or TOEFL for English programs), a motivation letter, and a CV.

Application deadlines vary by program: winter semester programs typically close between May and July. Some Master's programs have earlier deadlines, so check the specific department page on the university website well in advance.

For German-taught programs, you will need to demonstrate German language proficiency at B2 or C1 level through TestDaF or DSH. If you are still building your German, the university's Language Teaching Centre offers intensive preparation courses.

**A Place That Shapes You**

The University of Freiburg is not the most internationally famous German university — that title belongs to institutions like TU Munich or Heidelberg. But for the right student, it might be the best choice. The combination of genuine academic depth, a world-class quality of life, free education, a sustainability-focused culture, and a location at the crossroads of Germany, France, and Switzerland makes it a genuinely distinctive option.

Students who thrive here tend to be intellectually curious, appreciate a slower pace than Berlin, and want to feel embedded in a real city rather than a pure university town. If that sounds like you, Freiburg is worth a serious look.`

const post = {
  title: "University of Freiburg: Germany's Hidden Gem in the Black Forest",
  slug: 'university-of-freiburg-germany-hidden-gem-black-forest',
  excerpt: "Founded in 1457, the University of Freiburg combines 570 years of academic history with free tuition, a stunning Black Forest location, and one of Germany's best student quality-of-life experiences.",
  content,
  category: 'University Spotlights',
  author: 'UniGateEU Team',
  published: true,
}

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicHNsaG92enRtZnd5b3hyamVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU3MzQ2MSwiZXhwIjoyMDkyMTQ5NDYxfQ.6VDJLsveNJWfFTHe_Xo_nwyg4Lh43tkBI7lkUSkRHRM'

const body = JSON.stringify([post])

const options = {
  hostname: 'dbpslhovztmfwyoxrjee.supabase.co',
  path: '/rest/v1/blog_posts',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Prefer': 'return=representation',
    'Content-Length': Buffer.byteLength(body),
  },
}

const req = https.request(options, res => {
  let data = ''
  res.on('data', chunk => { data += chunk })
  res.on('end', () => {
    if (res.statusCode === 201) {
      const rows = JSON.parse(data)
      console.log('✓ Posted:', rows[0].id)
      console.log('  Title:', rows[0].title)
      console.log('  Slug:', rows[0].slug)
      console.log('  Category:', rows[0].category)
      console.log('  Published:', rows[0].published)
    } else {
      console.error('✗ Error', res.statusCode, data)
    }
  })
})
req.on('error', e => console.error(e))
req.write(body)
req.end()
