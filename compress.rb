
def process_dir(dir)
  print "Compress static files:\n\n"
  Dir.glob("#{dir}/*") do |file|
    if File.directory? file
      process_dir file
      next
    end
    puts "  #{file}"
    system "gzip -c #{file} > #{file}.gz"
  end
  print "\n"
end

process_dir ARGV[0]
