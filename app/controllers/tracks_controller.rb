class TracksController < ApplicationController  
  
  def index
    @tracks = Track.all
  end

  def new
    @track = Track.new    
    @track.marker.build()        
  end

  def create    
    uploaded_io = params[:track][:gpx]
    if uploaded_io != nil && !uploaded_io.is_a?(String) && !File.exist?(uploaded_io.original_filename)      
      unique_gpx = Time.now.to_i.to_s + "_" + uploaded_io.original_filename
      File.open(Rails.root.join('public', 'uploads', unique_gpx), 'wb') do |file|
        file.write(uploaded_io.read)
      end      
    else
      unique_gpx = uploaded_io
    end

    @track = Track.new(gpx: unique_gpx, name: params[:track][:name], description: params[:track][:description])    

    if(params[:track][:markers] != nil)
      params[:track][:markers].each do |attrs|        
        @track.marker.build(lon: attrs[:lon], lat: attrs[:lat], title: attrs[:title], description: attrs[:description])
      end
    else
      @track.marker.build()
    end
    
    if @track.save
      redirect_to @track, notice: "Track was created"
    else  
      render :new
    end
    
  end

  def show
  end

  def edit
  end

  def update
  end

  def destroy
  end
end
